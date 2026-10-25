import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  scrypt,
  timingSafeEqual,
} from "node:crypto";
function derive(password: string, salt: string, cost: number): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(
      password,
      salt,
      64,
      { N: cost, r: 8, p: 1, maxmem: 192 * 1024 * 1024 },
      (error, key) => (error ? reject(error) : resolve(key)),
    ),
  );
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const cost = process.env.NODE_ENV === "test" ? 16384 : 131072;
  const hash = await derive(password, salt, cost);
  return `scrypt:${cost}:${salt}:${hash.toString("hex")}`;
}
export async function verifyPassword(password: string, stored: string) {
  const [algorithm, costString, salt, hex] = stored.split(":");
  const cost = Number(costString);
  if (![16384, 131072].includes(cost)) return false;
  if (algorithm !== "scrypt" || !salt || !/^[a-f0-9]{128}$/i.test(hex || ""))
    return false;
  const hash = await derive(password, salt, cost);
  return timingSafeEqual(hash, Buffer.from(hex, "hex"));
}
export function encrypt(value: string, key: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", Buffer.from(key, "hex"), iv);
  return Buffer.concat([
    iv,
    cipher.update(value, "utf8"),
    cipher.final(),
    cipher.getAuthTag(),
  ]).toString("base64url");
}
export function decrypt(value: string, key: string) {
  const bytes = Buffer.from(value, "base64url");
  const cipher = createDecipheriv(
    "aes-256-gcm",
    Buffer.from(key, "hex"),
    bytes.subarray(0, 12),
  );
  cipher.setAuthTag(bytes.subarray(-16));
  return Buffer.concat([
    cipher.update(bytes.subarray(12, -16)),
    cipher.final(),
  ]).toString("utf8");
}
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export function newTotpSecret() {
  const bits = [...randomBytes(20)]
    .map((x) => x.toString(2).padStart(8, "0"))
    .join("");
  return bits
    .match(/.{5}/g)!
    .map((chunk) => alphabet[parseInt(chunk, 2)])
    .join("");
}
function base32(secret: string) {
  const bits = [...secret]
    .map((c) => alphabet.indexOf(c).toString(2).padStart(5, "0"))
    .join("");
  return Buffer.from(bits.match(/.{8}/g)!.map((b) => parseInt(b, 2)));
}
export function totp(secret: string, step = Math.floor(Date.now() / 30000)) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const hash = createHmac("sha1", base32(secret)).update(counter).digest();
  const offset = hash[hash.length - 1] & 15;
  return ((hash.readUInt32BE(offset) & 0x7fffffff) % 1000000)
    .toString()
    .padStart(6, "0");
}
export function verifyTotp(
  secret: string,
  code: string,
  lastStep: string | null,
): number | null {
  const now = Math.floor(Date.now() / 30000);
  if (!/^\d{6}$/.test(code)) return null;
  for (const step of [now - 1, now, now + 1])
    if (
      step > Number(lastStep ?? 0) &&
      timingSafeEqual(Buffer.from(totp(secret, step)), Buffer.from(code))
    )
      return step;
  return null;
}
