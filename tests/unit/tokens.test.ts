import { describe, expect, it, vi } from "vitest";
import { hashPassword, signToken, verifyPassword, verifyToken } from "@/lib/auth/tokens";

const SECRET = "x".repeat(40);

describe("signed tokens", () => {
  it("round-trips a payload", () => {
    const t = signToken({ sub: "a@b.c", purpose: "admin" }, 60, SECRET);
    expect(verifyToken(t, SECRET)).toMatchObject({ sub: "a@b.c", purpose: "admin" });
  });

  it("rejects a tampered payload", () => {
    const t = signToken({ sub: "a@b.c" }, 60, SECRET);
    const [, sig] = t.split(".");
    const forged = `${Buffer.from(JSON.stringify({ sub: "evil", exp: 9e9 })).toString("base64url")}.${sig}`;
    expect(verifyToken(forged, SECRET)).toBeNull();
  });

  it("rejects a token signed with another secret", () => {
    expect(verifyToken(signToken({ sub: "x" }, 60, "y".repeat(40)), SECRET)).toBeNull();
  });

  it("rejects expired tokens", () => {
    vi.useFakeTimers();
    const t = signToken({ sub: "x" }, 10, SECRET);
    vi.advanceTimersByTime(11_000);
    expect(verifyToken(t, SECRET)).toBeNull();
    vi.useRealTimers();
  });

  it("rejects malformed input", () => {
    for (const bad of [undefined, null, "", "abc", "a.b.c", "!!!.???"]) expect(verifyToken(bad, SECRET)).toBeNull();
  });
});

describe("password hashing", () => {
  it("verifies the right password and rejects others", async () => {
    const h = await hashPassword("correct horse battery");
    expect(h.startsWith("scrypt.")).toBe(true);
    expect(h).not.toContain("$");
    expect(await verifyPassword("correct horse battery", h)).toBe(true);
    expect(await verifyPassword("wrong", h)).toBe(false);
  });

  it("salts each hash", async () => {
    expect(await hashPassword("same")).not.toBe(await hashPassword("same"));
  });

  it("rejects malformed stored hashes", async () => {
    expect(await verifyPassword("x", "not-a-hash")).toBe(false);
  });
});
