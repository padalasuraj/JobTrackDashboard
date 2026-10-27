package com.jobtrack;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
    "spring.datasource.url=${TEST_DATABASE_URL:jdbc:h2:mem:jobtrack-test;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH;DB_CLOSE_DELAY=-1}",
    "spring.datasource.username=${TEST_DATABASE_USERNAME:sa}", "spring.datasource.password=${TEST_DATABASE_PASSWORD:}",
    "app.dev-email-log=true", "debug=false"
})
@AutoConfigureMockMvc
class ApiIntegrationTest {
    private static final String ORIGIN = "http://localhost:3000";
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired UserRepository users;
    @Autowired SessionRepository sessions;
    @Autowired PasswordResetRepository resets;
    @Autowired ApplicationRepository applications;

    @Test void healthAndOptionalProviderConfigurationArePublic() throws Exception {
        mvc.perform(get("/api/health")).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("UP"));
        mvc.perform(get("/api/auth/config")).andExpect(status().isOk())
            .andExpect(jsonPath("$.googleEnabled").value(false)).andExpect(jsonPath("$.passwordResetEnabled").value(true));
        mvc.perform(get("/api/auth/google")).andExpect(status().is3xxRedirection())
            .andExpect(redirectedUrl(ORIGIN + "/login?error=google_unavailable"));
        mvc.perform(get("/api/auth/google/callback?code=bad&state=bad")).andExpect(status().is3xxRedirection())
            .andExpect(redirectedUrl(ORIGIN + "/login?error=google_failed"));
    }

    @Test void registrationHashingLoginAndLogoutWorkWithoutGoogle() throws Exception {
        String email = uniqueEmail();
        MvcResult registered = register(email);
        Cookie session = cookie(registered);
        assertThat(registered.getResponse().getHeader("Set-Cookie")).contains("HttpOnly", "SameSite=Lax");
        UserAccount user = users.findByEmail(email).orElseThrow();
        assertThat(user.passwordHash).startsWith("$2").doesNotContain("Password123!");
        assertThat(sessions.findAll()).anySatisfy(s -> assertThat(s.tokenHash).hasSize(64));
        mvc.perform(get("/api/auth/me").cookie(session)).andExpect(status().isOk()).andExpect(jsonPath("$.user.email").value(email));
        mvc.perform(post("/api/auth/login").header("Origin", ORIGIN).contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsBytes(Map.of("email", email.toUpperCase(), "password", "Password123!"))))
            .andExpect(status().isOk());
        mvc.perform(post("/api/auth/login").header("Origin", ORIGIN).contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsBytes(Map.of("email", email, "password", "Wrong123456"))))
            .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/logout").header("Origin", ORIGIN).cookie(session)).andExpect(status().isOk());
        mvc.perform(get("/api/auth/me").cookie(session)).andExpect(status().isUnauthorized());
    }

    @Test void validationAndOriginChecksRejectUnsafeInput() throws Exception {
        mvc.perform(post("/api/auth/register").header("Origin", "https://attacker.example").contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isForbidden());
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isForbidden());
        mvc.perform(post("/api/auth/register").header("Origin", ORIGIN).contentType(MediaType.APPLICATION_JSON)
            .content("{\"name\":\"J\",\"email\":\"bad\",\"password\":\"short\"}"))
            .andExpect(status().isUnprocessableEntity()).andExpect(jsonPath("$.fields.email").exists());
        Cookie session = cookie(register(uniqueEmail()));
        var input = application("Acme"); input.put("applicationUrl", "javascript:alert(1)");
        mvc.perform(post("/api/applications").header("Origin", ORIGIN).cookie(session).contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsBytes(input))).andExpect(status().isUnprocessableEntity());
        input.put("applicationUrl", "example.com/job");
        mvc.perform(post("/api/applications").header("Origin", ORIGIN).cookie(session).contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsBytes(input))).andExpect(status().isUnprocessableEntity());
        input.put("applicationUrl", "https://example.com/job"); input.put("statusUrl", "/status");
        mvc.perform(post("/api/applications").header("Origin", ORIGIN).cookie(session).contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsBytes(input))).andExpect(status().isUnprocessableEntity());
        mvc.perform(get("/api/applications?page=-1").cookie(session)).andExpect(status().isBadRequest());
        mvc.perform(get("/api/applications?size=1000").cookie(session)).andExpect(status().isBadRequest());
        mvc.perform(get("/api/applications?status=INVALID").cookie(session)).andExpect(status().isBadRequest());
    }

    @Test void applicationsArePrivateAcrossEveryReadAndWritePath() throws Exception {
        Cookie alice = cookie(register(uniqueEmail())); Cookie bob = cookie(register(uniqueEmail()));
        String id = create(alice, application("Private Company")).get("id").asText();
        mvc.perform(get("/api/applications").cookie(bob)).andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements").value(0)).andExpect(jsonPath("$.summary.total").value(0));
        mvc.perform(get("/api/applications/" + id).cookie(bob)).andExpect(status().isNotFound());
        mvc.perform(put("/api/applications/" + id).header("Origin", ORIGIN).cookie(bob).contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsBytes(application("Stolen")))).andExpect(status().isNotFound());
        mvc.perform(patch("/api/applications/" + id + "/status").header("Origin", ORIGIN).cookie(bob).contentType(MediaType.APPLICATION_JSON)
            .content("{\"status\":\"OFFER\"}")).andExpect(status().isNotFound());
        mvc.perform(delete("/api/applications/" + id).header("Origin", ORIGIN).cookie(bob)).andExpect(status().isNotFound());
        String export = export(bob);
        assertThat(export).doesNotContain("Private Company");
        mvc.perform(get("/api/applications")).andExpect(status().isUnauthorized());
    }

    @Test void crudSearchPaginationSummaryAndCsvExportWork() throws Exception {
        Cookie session = cookie(register(uniqueEmail()));
        var first = application("Acme"); first.put("notes", "=HYPERLINK(\"https://example.com\")");
        String id = create(session, first).get("id").asText();
        create(session, application("Beta"));
        mvc.perform(get("/api/applications?size=1&page=0&sort=company").cookie(session)).andExpect(status().isOk())
            .andExpect(jsonPath("$.totalPages").value(2)).andExpect(jsonPath("$.applications[0].company").value("Acme"));
        mvc.perform(get("/api/applications?search=acME&status=APPLIED").cookie(session)).andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements").value(1)).andExpect(jsonPath("$.summary.total").value(2));
        mvc.perform(get("/api/applications?search=%25").cookie(session)).andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(patch("/api/applications/" + id + "/status").header("Origin", ORIGIN).cookie(session).contentType(MediaType.APPLICATION_JSON)
            .content("{\"status\":\"INTERVIEW\"}")).andExpect(status().isOk()).andExpect(jsonPath("$.application.status").value("INTERVIEW"));
        mvc.perform(get("/api/applications").cookie(session)).andExpect(jsonPath("$.summary.interviews").value(1));
        var changed = application("Acme Updated"); changed.put("notes", "  =formula"); changed.put("status", "OFFER");
        mvc.perform(put("/api/applications/" + id).header("Origin", ORIGIN).cookie(session).contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsBytes(changed))).andExpect(status().isOk()).andExpect(jsonPath("$.application.company").value("Acme Updated"));
        String exported = export(session);
        assertThat(exported).contains("Acme Updated", "'=formula", "https://example.com/apply");
        mvc.perform(delete("/api/applications/" + id).header("Origin", ORIGIN).cookie(session)).andExpect(status().isNoContent());
        mvc.perform(get("/api/applications/" + id).cookie(session)).andExpect(status().isNotFound());
    }

    @Test void passwordResetIsSingleUseAndRevokesExistingSessions() throws Exception {
        String email = uniqueEmail(); Cookie session = cookie(register(email));
        UserAccount user = users.findByEmail(email).orElseThrow();
        String token = Tokens.random(); PasswordReset reset = new PasswordReset(); reset.tokenHash = Tokens.hash(token);
        reset.userId = user.id; reset.expiresAt = Instant.now().plusSeconds(600); resets.save(reset);
        byte[] body = json.writeValueAsBytes(Map.of("token", token, "password", "Replacement123!"));
        mvc.perform(post("/api/auth/reset-password").header("Origin", ORIGIN).contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isOk());
        mvc.perform(get("/api/auth/me").cookie(session)).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/reset-password").header("Origin", ORIGIN).contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isBadRequest());
        mvc.perform(post("/api/auth/login").header("Origin", ORIGIN).contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsBytes(Map.of("email", email, "password", "Replacement123!"))))
            .andExpect(status().isOk());
    }

    @Test void csvEscapesQuotesAndFormulaPrefixes() {
        assertThat(ApplicationController.csvCell("say \"hello\"")).isEqualTo("\"say \"\"hello\"\"\"");
        assertThat(ApplicationController.csvCell("@command")).isEqualTo("\"'@command\"");
        assertThat(ApplicationController.csvCell("  -2")).isEqualTo("\"'  -2\"");
    }

    @Test void exportCrossesBatchBoundariesWithoutMissingOrRepeatingApplications() throws Exception {
        String email = uniqueEmail(); Cookie session = cookie(register(email));
        UUID owner = users.findByEmail(email).orElseThrow().id;
        var rows = new java.util.ArrayList<JobApplication>();
        for (int i = 0; i < 105; i++) {
            JobApplication application = new JobApplication(); application.userId = owner;
            application.company = "Export Company " + i; application.title = "Engineer";
            application.applicationUrl = "https://example.com/job/" + i; rows.add(application);
        }
        applications.saveAllAndFlush(rows);
        String csv = export(session);
        assertThat(csv.lines().count()).isEqualTo(106);
        for (int i = 0; i < 105; i++) assertThat(csv).contains("\"Export Company " + i + "\"");
    }

    private MvcResult register(String email) throws Exception {
        return mvc.perform(post("/api/auth/register").header("Origin", ORIGIN).contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsBytes(Map.of("name", "Test User", "email", email, "password", "Password123!"))))
            .andExpect(status().isCreated()).andReturn();
    }
    private String export(Cookie session) throws Exception {
        MvcResult pending = mvc.perform(get("/api/applications/export").cookie(session)).andExpect(request().asyncStarted()).andReturn();
        return mvc.perform(asyncDispatch(pending)).andExpect(status().isOk())
            .andExpect(header().string("Content-Disposition", "attachment; filename=\"jobtrack-applications.csv\""))
            .andReturn().getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
    }
    private JsonNode create(Cookie session, Map<String, Object> body) throws Exception {
        return json.readTree(mvc.perform(post("/api/applications").header("Origin", ORIGIN).cookie(session).contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsBytes(body))).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).get("application");
    }
    private static Cookie cookie(MvcResult result) {
        String header = result.getResponse().getHeaders("Set-Cookie").stream().filter(s -> s.startsWith(SessionService.COOKIE + "=")).findFirst().orElseThrow();
        return new Cookie(SessionService.COOKIE, header.substring(header.indexOf('=') + 1, header.indexOf(';')));
    }
    private static String uniqueEmail() { return "test-" + UUID.randomUUID() + "@gmail.com"; }
    private static Map<String, Object> application(String company) {
        return new java.util.HashMap<>(Map.of("company", company, "title", "Software Engineer", "salary", "12–16 LPA", "location", "Bengaluru",
            "workMode", "HYBRID", "status", "APPLIED", "applicationUrl", "https://example.com/apply",
            "statusUrl", "https://example.com/status", "appliedDate", "2026-10-27", "notes", "Follow up next week"));
    }
}
