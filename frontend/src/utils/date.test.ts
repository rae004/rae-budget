import { describe, it, expect } from "vitest";
import { parseLocalDate, formatDate, formatDateRange } from "./date";

describe("parseLocalDate", () => {
  it("parses a YYYY-MM-DD string as a local date", () => {
    const date = parseLocalDate("2026-04-06");
    expect(date).not.toBeNull();
    expect(date!.getFullYear()).toBe(2026);
    expect(date!.getMonth()).toBe(3); // April (0-indexed)
    expect(date!.getDate()).toBe(6);
  });

  it("returns null for null input", () => {
    expect(parseLocalDate(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(parseLocalDate(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseLocalDate("")).toBeNull();
  });

  it("returns null for malformed (wrong number of parts)", () => {
    expect(parseLocalDate("2026/04/06")).toBeNull();
    expect(parseLocalDate("2026-04")).toBeNull();
  });

  it("returns null when parts are not numeric", () => {
    expect(parseLocalDate("abcd-ef-gh")).toBeNull();
  });
});

describe("formatDate", () => {
  it("formats a valid date with default options", () => {
    const result = formatDate("2026-04-06");
    expect(result).toContain("Apr");
    expect(result).toContain("6");
    expect(result).toContain("2026");
  });

  it("respects custom options", () => {
    const result = formatDate("2026-04-06", { month: "short", day: "numeric" });
    expect(result).toContain("Apr");
    expect(result).toContain("6");
    // Year should NOT be present
    expect(result).not.toContain("2026");
  });

  it("returns '-' for null", () => {
    expect(formatDate(null)).toBe("-");
  });

  it("returns '-' for invalid string", () => {
    expect(formatDate("not-a-date")).toBe("-");
  });
});

describe("formatDateRange", () => {
  it("formats a range as 'start - end'", () => {
    const result = formatDateRange("2026-04-06", "2026-04-19");
    expect(result).toContain("Apr");
    expect(result).toContain("6");
    expect(result).toContain("19");
    expect(result).toContain(" - ");
  });

  it("includes year only on the end date", () => {
    const result = formatDateRange("2026-04-06", "2026-04-19");
    // Year appears once (on the end)
    const yearMatches = result.match(/2026/g) ?? [];
    expect(yearMatches.length).toBe(1);
  });
});
