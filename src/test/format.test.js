import { describe, expect, it } from "vitest";
import { formatDateLabel, formatNumber, round2, toInt, toNumber } from "../utils/format";

describe("format utils", () => {
  it("normalizes numeric values safely", () => {
    expect(toNumber("12.5")).toBe(12.5);
    expect(toNumber("abc")).toBe(0);
    expect(toInt("12.6")).toBe(13);
    expect(round2(12.345)).toBe(12.35);
  });

  it("formats numbers and date labels", () => {
    expect(formatNumber(1234.56, 1)).toBe("1234,6");
    expect(formatDateLabel("2026-05-16", "es")).toMatch(/16/);
    expect(formatDateLabel("2026-05-16", "en")).toMatch(/16/);
  });
});
