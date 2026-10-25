import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
const base = process.env.SMOKE_API_URL || "http://127.0.0.1:4000/v1";
const inbox = process.env.MAILPIT_URL || "http://127.0.0.1:8025";
if (!["127.0.0.1", "localhost"].includes(new URL(inbox).hostname))
  throw new Error("Mail smoke requires a local Mailpit inbox");
const email = `mail-smoke-${randomUUID()}@example.com`;
async function post(path, body) {
  const r = await fetch(`${base}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  assert.equal(r.status, 201, `${path} status`);
  return (await r.json()).data;
}
const account = await post("auth/register", {
  name: "SMTP Verification",
  email,
  password: `Initial-${randomUUID()}`,
});
await post("auth/password-reset/request", { email });
let text = "";
const deadline = Date.now() + 90000;
while (Date.now() < deadline) {
  const box = await (await fetch(`${inbox}/api/v1/messages`)).json();
  const message = box.messages.find(
    (m) =>
      m.Subject === "Reset your MyShop password" &&
      m.To.some((t) => t.Address === email),
  );
  if (message) {
    text = (await (await fetch(`${inbox}/api/v1/message/${message.ID}`)).json())
      .Text;
    break;
  }
  await new Promise((r) => setTimeout(r, 500));
}
assert.ok(text, "real SMTP reset message arrived in Mailpit");
const token =
  text.match(/token=([A-Za-z0-9_-]{64})/)?.[1] ||
  text.match(/token[^A-Za-z0-9_-]+([A-Za-z0-9_-]{64})/)?.[1];
assert.ok(token, "reset token present");
await post("auth/password-reset/verify", { token });
const newPassword = `Changed-${randomUUID()}`;
await post("auth/password-reset/complete", { token, newPassword });
assert.equal(
  (
    await fetch(`${base}/me`, {
      headers: { Authorization: `Bearer ${account.accessToken}` },
    })
  ).status,
  401,
  "reset revokes old session",
);
await post("auth/login", { email, password: newPassword });
console.log(
  JSON.stringify({
    smtpDelivery: true,
    resetTokenVerified: true,
    passwordReset: true,
    oldSessionRevoked: true,
    newLogin: true,
  }),
);
