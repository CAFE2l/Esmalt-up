import { describe, it, expect } from "vitest";
import { normalizePublicCode, validatePublicCodeFormat } from "./certificateCode";

describe("normalizePublicCode", () => {
  it("trims and uppercases", () => {
    expect(normalizePublicCode("  esm-2026-mmj8nmt6 ")).toBe("ESM-2026-MMJ8NMT6");
  });

  it("removes inner spaces", () => {
    expect(normalizePublicCode("ESM 2026 MMJ8NMT6")).toBe("ESM-2026-MMJ8NMT6");
    expect(normalizePublicCode("esm 2026 mmj8nmt6")).toBe("ESM-2026-MMJ8NMT6");
  });

  it("accepts codes without hyphens", () => {
    expect(normalizePublicCode("ESM2026MMJ8NMT6")).toBe("ESM-2026-MMJ8NMT6");
    expect(normalizePublicCode("esm2026mmj8nmt6")).toBe("ESM-2026-MMJ8NMT6");
  });

  it("handles extra hyphens", () => {
    expect(normalizePublicCode("ESM--2026--MMJ8NMT6")).toBe("ESM-2026-MMJ8NMT6");
  });

  it("returns empty for empty input", () => {
    expect(normalizePublicCode("")).toBe("");
  });
});

describe("validatePublicCodeFormat", () => {
  it("accepts the canonical format", () => {
    expect(validatePublicCodeFormat("ESM-2026-MMJ8NMT6")).toBe(true);
  });

  it("accepts pasted variants after normalization", () => {
    expect(validatePublicCodeFormat("esm-2026-mmj8nmt6")).toBe(true);
    expect(validatePublicCodeFormat("ESM 2026 MMJ8NMT6")).toBe(true);
  });

  it("rejects invalid codes", () => {
    expect(validatePublicCodeFormat("ESM-2026-MMJ8NMT")).toBe(false);
    expect(validatePublicCodeFormat("ESM-2026-MMJ8NMT6X")).toBe(false);
    expect(validatePublicCodeFormat("ABC-2026-MMJ8NMT6")).toBe(false);
    expect(validatePublicCodeFormat("")).toBe(false);
  });
});
