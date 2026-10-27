package com.jobtrack;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.nio.charset.StandardCharsets;
import java.io.BufferedWriter;
import java.io.OutputStreamWriter;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

@RestController
@RequestMapping("/api/applications")
class ApplicationController {
    private final ApplicationRepository repository;
    private final TransactionTemplate exportTransactions;
    ApplicationController(ApplicationRepository repository, PlatformTransactionManager transactions) {
        this.repository = repository;
        this.exportTransactions = new TransactionTemplate(transactions);
        this.exportTransactions.setReadOnly(true);
    }

    record ApplicationInput(
        @NotBlank @Size(max = 150) String company,
        @NotBlank @Size(max = 150) String title,
        @Size(max = 100) String salary,
        @Size(max = 150) String location,
        WorkMode workMode,
        ApplicationStatus status,
        @NotBlank @HttpUrl @Size(max = 2048) String applicationUrl,
        @HttpUrl @Size(max = 2048) String statusUrl,
        LocalDate appliedDate,
        LocalDate deadline,
        @Size(max = 5000) String notes
    ) {
        ApplicationInput {
            company = clean(company); title = clean(title); salary = clean(salary); location = clean(location);
            applicationUrl = clean(applicationUrl); statusUrl = clean(statusUrl); notes = clean(notes);
            workMode = workMode == null ? WorkMode.UNSPECIFIED : workMode;
            status = status == null ? ApplicationStatus.SAVED : status;
        }
    }
    record StatusInput(@NotNull ApplicationStatus status) {}
    record ApplicationView(UUID id, String company, String title, String salary, String location, WorkMode workMode,
                           ApplicationStatus status, String applicationUrl, String statusUrl, LocalDate appliedDate,
                           LocalDate deadline, String notes, Instant createdAt, Instant updatedAt) {
        static ApplicationView of(JobApplication a) {
            return new ApplicationView(a.id, a.company, a.title, a.salary, a.location, a.workMode, a.status,
                a.applicationUrl, a.statusUrl, a.appliedDate, a.deadline, a.notes, a.createdAt, a.updatedAt);
        }
    }

    @GetMapping
    @Transactional(readOnly = true)
    Map<String, Object> list(Authentication auth, @RequestParam(defaultValue = "") String search,
        @RequestParam(defaultValue = "") String status, @RequestParam(defaultValue = "updated") String sort,
        @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        UUID owner = owner(auth);
        if (page < 0 || size < 1 || size > 100 || search.length() > 200) throw badRequest("Invalid page, size or search.");
        Sort order = switch (sort) {
            case "updated" -> Sort.by(Sort.Direction.DESC, "updatedAt");
            case "company" -> Sort.by("company");
            case "applied" -> Sort.by(Sort.Direction.DESC, "appliedDate");
            default -> throw badRequest("Invalid sort option.");
        };
        Page<JobApplication> result = repository.findAll(spec(owner, search, status), PageRequest.of(page, size, order.and(Sort.by("id"))));
        Map<String, Long> summary = Map.of(
            "total", repository.countByUserId(owner),
            "active", repository.countByUserIdAndStatusIn(owner, List.of(ApplicationStatus.APPLIED, ApplicationStatus.ASSESSMENT, ApplicationStatus.INTERVIEW)),
            "interviews", repository.countByUserIdAndStatus(owner, ApplicationStatus.INTERVIEW),
            "offers", repository.countByUserIdAndStatus(owner, ApplicationStatus.OFFER));
        return Map.of("applications", result.getContent().stream().map(ApplicationView::of).toList(), "page", result.getNumber(),
            "totalPages", result.getTotalPages(), "totalElements", result.getTotalElements(), "summary", summary);
    }

    @GetMapping("/{id}")
    Map<String, ApplicationView> get(Authentication auth, @PathVariable UUID id) {
        return Map.of("application", ApplicationView.of(owned(id, owner(auth))));
    }

    @PostMapping
    @Transactional
    ResponseEntity<?> create(Authentication auth, @Valid @RequestBody ApplicationInput input) {
        UUID owner = owner(auth);
        if (repository.countByUserId(owner) >= 10000) throw new ApiException(HttpStatus.CONFLICT, "Your workspace has reached 10,000 applications. Export and remove older entries to continue.");
        JobApplication application = new JobApplication(); application.userId = owner;
        copy(input, application);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("application", ApplicationView.of(repository.save(application))));
    }

    @PutMapping("/{id}")
    @Transactional
    Map<String, ApplicationView> update(Authentication auth, @PathVariable UUID id, @Valid @RequestBody ApplicationInput input) {
        JobApplication application = owned(id, owner(auth)); copy(input, application);
        return Map.of("application", ApplicationView.of(repository.save(application)));
    }

    @PatchMapping("/{id}/status")
    @Transactional
    Map<String, ApplicationView> updateStatus(Authentication auth, @PathVariable UUID id, @Valid @RequestBody StatusInput input) {
        JobApplication application = owned(id, owner(auth)); application.status = input.status(); application.updatedAt = Instant.now();
        return Map.of("application", ApplicationView.of(repository.save(application)));
    }

    @DeleteMapping("/{id}")
    @Transactional
    ResponseEntity<Void> delete(Authentication auth, @PathVariable UUID id) {
        repository.delete(owned(id, owner(auth))); return ResponseEntity.noContent().build();
    }

    @GetMapping("/export")
    ResponseEntity<StreamingResponseBody> export(Authentication auth, @RequestParam(defaultValue = "") String search,
                                  @RequestParam(defaultValue = "") String status) {
        if (search.length() > 200) throw badRequest("Search is too long.");
        Specification<JobApplication> filter = spec(owner(auth), search, status);
        // Stream batches with keyset pagination. No full workspace or CSV is retained in JVM memory.
        StreamingResponseBody stream = output -> {
            BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(output, StandardCharsets.UTF_8));
            writer.write("\ufeffS.No,Company,Role,Package,Status,Application Link,Status Link,Location,Work Mode,Applied Date,Deadline,Notes\r\n");
            UUID cursor = null; int serial = 0;
            while (true) {
                final UUID after = cursor;
                Specification<JobApplication> batchFilter = after == null ? filter : filter.and((root, query, cb) -> cb.greaterThan(root.get("id"), after));
                List<JobApplication> rows = exportTransactions.execute(transaction -> repository.findBy(batchFilter,
                    query -> query.sortBy(Sort.by("id")).limit(100).all()));
                if (rows == null || rows.isEmpty()) break;
                for (JobApplication a : rows) {
                    List<String> values = List.of(String.valueOf(++serial), a.company, a.title, a.salary, a.status.name(), a.applicationUrl,
                        a.statusUrl, a.location, a.workMode.name(), a.appliedDate == null ? "" : a.appliedDate.toString(),
                        a.deadline == null ? "" : a.deadline.toString(), a.notes);
                    writer.write(String.join(",", values.stream().map(ApplicationController::csvCell).toList())); writer.write("\r\n");
                }
                writer.flush(); cursor = rows.getLast().id;
                if (rows.size() < 100) break;
            }
            writer.flush();
        };
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"jobtrack-applications.csv\"")
            .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8)).body(stream);
    }

    private JobApplication owned(UUID id, UUID owner) { return repository.findByIdAndUserId(id, owner).orElseThrow(ApiException::notFound); }
    private static UUID owner(Authentication auth) { return (UUID) auth.getPrincipal(); }
    private static String clean(String value) { return value == null ? "" : value.trim(); }
    private static ApiException badRequest(String message) { return new ApiException(HttpStatus.BAD_REQUEST, message); }

    private static Specification<JobApplication> spec(UUID owner, String search, String status) {
        ApplicationStatus selected;
        try { selected = status.isBlank() ? null : ApplicationStatus.valueOf(status); }
        catch (IllegalArgumentException ex) { throw badRequest("Invalid application status."); }
        return (root, query, cb) -> {
            var predicate = cb.equal(root.get("userId"), owner);
            if (selected != null) predicate = cb.and(predicate, cb.equal(root.get("status"), selected));
            if (!search.isBlank()) {
                String like = "%" + search.trim().toLowerCase(java.util.Locale.ROOT).replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
                predicate = cb.and(predicate, cb.or(cb.like(cb.lower(root.get("company")), like, '\\'),
                    cb.like(cb.lower(root.get("title")), like, '\\'), cb.like(cb.lower(root.get("location")), like, '\\')));
            }
            return predicate;
        };
    }
    static String csvCell(String value) {
        String trimmed = value.stripLeading();
        if (!trimmed.isEmpty() && "=+-@".indexOf(trimmed.charAt(0)) >= 0) value = "'" + value;
        return "\"" + value.replace("\"", "\"\"") + "\"";
    }
    private static void copy(ApplicationInput in, JobApplication out) {
        out.company = in.company(); out.title = in.title(); out.salary = in.salary(); out.location = in.location();
        out.workMode = in.workMode(); out.status = in.status(); out.applicationUrl = in.applicationUrl();
        out.statusUrl = in.statusUrl(); out.appliedDate = in.appliedDate(); out.deadline = in.deadline(); out.notes = in.notes();
        out.updatedAt = Instant.now();
    }
}
