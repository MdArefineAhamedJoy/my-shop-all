import {
  decrypt,
  encrypt,
  hashPassword,
  newTotpSecret,
  totp,
  verifyPassword,
  verifyTotp,
} from "./crypto";
describe("Authentication primitives", () => {
  it("salts password hashes and verifies only the correct password", async () => {
    const [a, b] = await Promise.all([
      hashPassword("a strong password"),
      hashPassword("a strong password"),
    ]);
    expect(a).not.toBe(b);
    expect(await verifyPassword("a strong password", a)).toBe(true);
    expect(await verifyPassword("wrong", a)).toBe(false);
  });
  it("authenticates encrypted secrets and rejects tampering", () => {
    const key = "a".repeat(64);
    const value = encrypt("private-token", key);
    expect(decrypt(value, key)).toBe("private-token");
    const corrupt = Buffer.from(value, "base64url");
    corrupt[15] ^= 1;
    expect(() => decrypt(corrupt.toString("base64url"), key)).toThrow();
  });
  it("implements the RFC 6238 SHA-1 test vector and rejects reused codes", () => {
    const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
    expect(totp(secret, 1)).toBe("287082");
    const current = newTotpSecret();
    const step = Math.floor(Date.now() / 30000);
    const code = totp(current, step);
    expect(verifyTotp(current, code, null)).toBe(step);
    expect(verifyTotp(current, code, String(step))).toBeNull();
  });
});
