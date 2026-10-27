import { describe, expect, it } from "vitest";
import {
  formatDate,
  initials,
  isSafeUrl,
  toApplicationInput,
  emptyApplication,
  type Application,
} from "../src/lib/tracker";

describe("saved links", () => {
  it("accepts only full HTTP links and excludes embedded credentials and scripts", () => {
    expect(isSafeUrl("https://careers.example.com/job?id=123")).toBe(true);
    expect(isSafeUrl("http://localhost:8080/portal")).toBe(true);
    for (const url of [
      "javascript:alert(1)",
      "data:text/html,hello",
      "//example.com",
      "not a url",
      "https://user:secret@example.com",
    ])
      expect(isSafeUrl(url)).toBe(false);
  });
});
describe("application editing", () => {
  it("normalizes missing optional fields without leaking record IDs into updates", () => {
    const record = {
      ...emptyApplication,
      company: "Acme",
      title: "Engineer",
      id: "private-id",
      statusUrl: null,
      appliedDate: null,
      createdAt: "today",
      updatedAt: "today",
    } as unknown as Application;
    const input = toApplicationInput(record);
    expect(input.statusUrl).toBe("");
    expect(input.appliedDate).toBe("");
    expect(input).not.toHaveProperty("id");
    expect(input.company).toBe("Acme");
  });
  it("keeps date-only calendar dates stable and handles absent values", () => {
    expect(formatDate("2026-10-27")).toBe("27 Oct 2026");
    expect(formatDate(null)).toBe("—");
    expect(formatDate("invalid")).toBe("—");
  });
  it("builds legible initials for single names and company names", () => {
    expect(initials("  Ada Lovelace  ")).toBe("AL");
    expect(initials("Google")).toBe("G");
    expect(initials("")).toBe("?");
  });
});
