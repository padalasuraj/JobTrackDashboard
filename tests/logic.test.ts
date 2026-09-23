import { describe, expect, it } from "vitest";
import { addDays } from "date-fns";
import { closingLabel, needsAction } from "../src/lib/insights";

describe("closingLabel", () => {
  it("describes missing and upcoming deadlines", () => {
    expect(closingLabel(null)).toBe("No deadline");
    expect(closingLabel(addDays(new Date(), 1))).toBe("Closing tomorrow");
  });
});

describe("needsAction", () => {
  it("flags closing soon and missing application URLs", () => {
    const items = needsAction({
      id: "app1",
      status: "SAVED",
      progressUrl: null,
      job: { title: "Engineer", applicationUrl: null, closingDate: addDays(new Date(), 2), company: { name: "Acme" } },
      interviews: [],
      reminders: []
    });
    expect(items.some((item) => item.message.includes("closes"))).toBe(true);
    expect(items.some((item) => item.message.includes("missing"))).toBe(true);
  });
});
