import * as cheerio from "cheerio";

export type ExtractedJob = {
  company: string;
  title: string;
  jobId?: string | null;
  location?: string | null;
  workMode?: "ONSITE" | "HYBRID" | "REMOTE" | "UNKNOWN";
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string;
  experience?: string | null;
  employmentType?: string | null;
  description?: string | null;
  skills?: string | null;
  jobUrl?: string | null;
  applicationUrl?: string | null;
  companyUrl?: string | null;
  postedDate?: string | null;
  closingDate?: string | null;
  source?: string | null;
  extractionNotes: string[];
};

function text(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map(text).filter(Boolean).join(", ");
  if (value && typeof value === "object" && "name" in value) return text((value as { name?: unknown }).name);
  return "";
}

function toDate(value: unknown) {
  const raw = text(value);
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function inferWorkMode(value: string) {
  const lower = value.toLowerCase();
  if (lower.includes("remote")) return "REMOTE";
  if (lower.includes("hybrid")) return "HYBRID";
  if (lower.includes("onsite") || lower.includes("on-site")) return "ONSITE";
  return "UNKNOWN";
}

function findJobPosting(value: unknown): Record<string, unknown> | null {
  if (!value) return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findJobPosting(item);
      if (found) return found;
    }
    return null;
  }
  if (typeof value !== "object") return null;
  const object = value as Record<string, unknown>;
  const type = object["@type"];
  if (type === "JobPosting" || (Array.isArray(type) && type.includes("JobPosting"))) return object;
  if (object["@graph"]) return findJobPosting(object["@graph"]);
  return null;
}

async function fetchStaticHtml(url: string, notes: string[]) {
  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": "Mozilla/5.0 JobTrack/1.0",
        accept: "text/html,application/xhtml+xml"
      },
      signal: AbortSignal.timeout(12000)
    });
    if (!response.ok) notes.push(`Fetch returned HTTP ${response.status}`);
    return await response.text();
  } catch (error) {
    notes.push(error instanceof Error ? error.message : "Unable to fetch URL");
    return "";
  }
}

async function fetchRenderedHtml(url: string, notes: string[]) {
  const browserlessUrl = process.env.BROWSERLESS_URL;
  const browserlessToken = process.env.BROWSERLESS_TOKEN;
  if (!browserlessUrl && !browserlessToken) return "";
  try {
    const endpoint = browserlessUrl || `https://chrome.browserless.io/content?token=${browserlessToken}`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        url,
        waitForTimeout: 3000,
        gotoOptions: { waitUntil: "networkidle2", timeout: 20000 }
      }),
      signal: AbortSignal.timeout(30000)
    });
    if (!response.ok) {
      notes.push(`Rendered fetch returned HTTP ${response.status}`);
      return "";
    }
    notes.push("Used rendered-page extraction fallback.");
    return await response.text();
  } catch (error) {
    notes.push(error instanceof Error ? `Rendered extraction failed: ${error.message}` : "Rendered extraction failed");
    return "";
  }
}

function parseHtml(html: string, url: string, fallbackHost: string, notes: string[]): ExtractedJob {
  const $ = cheerio.load(html);
  let posting: Record<string, unknown> | null = null;
  $("script[type='application/ld+json']").each((_, el) => {
    if (posting) return;
    try {
      posting = findJobPosting(JSON.parse($(el).text()));
    } catch {
      notes.push("A JSON-LD block was present but could not be parsed.");
    }
  });

  const structured = posting as Record<string, unknown> | null;
  if (structured) {
    const location = text(structured["jobLocation"]);
    const org = structured["hiringOrganization"] as Record<string, unknown> | undefined;
    const baseSalary = structured["baseSalary"] as Record<string, unknown> | undefined;
    const value = baseSalary?.value as Record<string, unknown> | undefined;
    return {
      company: text(org?.name) || fallbackHost,
      title: text(structured["title"]) || $("title").text().trim() || "Not found",
      jobId: text(structured["identifier"]) || null,
      location: location || null,
      workMode: inferWorkMode(`${location} ${text(structured["jobLocationType"])}`),
      salaryMin: Number(value?.minValue) || null,
      salaryMax: Number(value?.maxValue) || Number(value?.value) || null,
      salaryCurrency: text(baseSalary?.currency) || "INR",
      experience: text(structured["experienceRequirements"]) || null,
      employmentType: text(structured["employmentType"]) || null,
      description: text(structured["description"]) || null,
      skills: text(structured["skills"]) || text(structured["qualifications"]) || null,
      jobUrl: url,
      applicationUrl: url,
      companyUrl: text(org?.sameAs) || null,
      postedDate: toDate(structured["datePosted"]),
      closingDate: toDate(structured["validThrough"]),
      source: "json-ld",
      extractionNotes: notes
    };
  }

  const title = $("meta[property='og:title']").attr("content") || $("h1").first().text() || $("title").text();
  const description =
    $("meta[name='description']").attr("content") ||
    $("meta[property='og:description']").attr("content") ||
    $("main").text().replace(/\s+/g, " ").slice(0, 4000);
  const body = $("body").text().replace(/\s+/g, " ");

  return {
    company: $("meta[property='og:site_name']").attr("content") || fallbackHost,
    title: title.trim() || "Not found",
    location: /remote/i.test(body) ? "Remote" : null,
    workMode: inferWorkMode(body),
    description: description?.trim() || null,
    skills: null,
    jobUrl: url,
    applicationUrl: url,
    source: "html-fallback",
    extractionNotes: notes.concat("Structured JobPosting data was not found; extracted from visible HTML.")
  };
}

export async function extractJobFromUrl(url: string): Promise<ExtractedJob> {
  const notes: string[] = [];
  let html = await fetchStaticHtml(url, notes);

  const fallbackHost = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return "Unknown company";
    }
  })();

  if (!html) html = await fetchRenderedHtml(url, notes);

  if (!html) {
    return {
      company: fallbackHost,
      title: "Not found",
      jobUrl: url,
      applicationUrl: url,
      source: "manual-fallback",
      extractionNotes: notes.length ? notes : ["The page could not be fetched. Add the details manually."]
    };
  }

  let parsed = parseHtml(html, url, fallbackHost, notes);
  if (parsed.title === "Not found" || !parsed.description) {
    const rendered = await fetchRenderedHtml(url, notes);
    if (rendered) {
      html = rendered;
      parsed = parseHtml(html, url, fallbackHost, notes);
      parsed.source = parsed.source === "json-ld" ? "rendered-json-ld" : "rendered-html-fallback";
    }
  }
  return parsed;
}
