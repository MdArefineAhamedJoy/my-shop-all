import { NextRequest, NextResponse } from "next/server";

/** The browser gets an HttpOnly opaque session; credentials never enter client storage. */
export async function proxyBackend(
  req: NextRequest,
  path: string[],
  admin = false,
) {
  if (
    path.some((p) => !/^[a-zA-Z0-9._~-]+$/.test(p) || p === "." || p === "..")
  )
    return NextResponse.json(
      { error: { message: "Invalid API path" } },
      { status: 400 },
    );
  const origin = process.env.APP_ORIGIN || new URL(req.url).origin;
  if (
    !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
    (req.headers.get("origin") !== origin ||
      req.headers.get("sec-fetch-site") === "cross-site")
  )
    return NextResponse.json(
      { error: { message: "Cross-origin mutation is forbidden" } },
      { status: 403 },
    );
  const cookieName = `${process.env.NODE_ENV === "production" ? "__Host-" : ""}${admin ? "shop_admin_session" : "shop_session"}`;
  const route = path.join("/");
  if (route === "auth/refresh")
    return NextResponse.json(
      { error: { message: "Browser sessions are managed by the server" } },
      { status: 400 },
    );
  const headers = new Headers();
  for (const name of ["content-type", "idempotency-key", "user-agent"]) {
    const value = req.headers.get(name);
    if (value) headers.set(name, value);
  }
  // Enabled only behind the deployment's Caddy proxy; API/Next ports stay private.
  if (process.env.TRUSTED_PROXY_HEADERS === "true") {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded)
      headers.set("x-forwarded-for", forwarded.split(",").at(-1)!.trim());
  }
  const session = req.cookies.get(cookieName)?.value;
  if (session) headers.set("authorization", `Session ${session}`);
  try {
    const limit = 6 * 1024 * 1024;
    let body: Uint8Array | undefined;
    if (!["GET", "HEAD"].includes(req.method) && req.body) {
      if (Number(req.headers.get("content-length") || 0) > limit)
        return NextResponse.json(
          { error: { message: "Upload is too large" } },
          { status: 413 },
        );
      const reader = req.body.getReader();
      const chunks: Uint8Array[] = [];
      let length = 0;
      for (;;) {
        const part = await reader.read();
        if (part.done) break;
        length += part.value.byteLength;
        if (length > limit) {
          await reader.cancel();
          return NextResponse.json(
            { error: { message: "Upload is too large" } },
            { status: 413 },
          );
        }
        chunks.push(part.value);
      }
      body = new Uint8Array(length);
      let offset = 0;
      for (const chunk of chunks) {
        body.set(chunk, offset);
        offset += chunk.length;
      }
    }
    const upstream = await fetch(
      `${process.env.API_INTERNAL_URL || "http://127.0.0.1:4000/v1"}/${route}${new URL(req.url).search}`,
      {
        method: req.method,
        headers,
        body: body?.buffer as ArrayBuffer | undefined,
        cache: "no-store",
        redirect: "manual",
        signal: AbortSignal.timeout(20000),
      },
    );
    if (["auth/login", "auth/register"].includes(route) && upstream.ok) {
      const value = await upstream.json();
      if (admin && !["admin", "staff"].includes(value.data.user.role)) {
        await fetch(
          `${process.env.API_INTERNAL_URL || "http://127.0.0.1:4000/v1"}/auth/logout`,
          {
            method: "POST",
            headers: { authorization: `Bearer ${value.data.accessToken}` },
          },
        );
        return NextResponse.json(
          { error: { message: "A staff account is required" } },
          { status: 403 },
        );
      }
      const response = NextResponse.json(
        { data: { user: value.data.user }, meta: value.meta },
        { status: upstream.status, headers: { "Cache-Control": "no-store" } },
      );
      response.cookies.set(cookieName, value.data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 86400,
      });
      return response;
    }
    const responseHeaders = new Headers({ "Cache-Control": "no-store" });
    for (const name of [
      "content-type",
      "content-disposition",
      "x-request-id",
      "retry-after",
    ]) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    const response = new NextResponse(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
    // A late failure from an older request must not erase a newer login cookie.
    if (route === "auth/logout")
      response.cookies.set(cookieName, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
    return response;
  } catch {
    return NextResponse.json(
      {
        error: {
          message: "The shop service is temporarily unavailable. Please retry.",
        },
      },
      { status: 503 },
    );
  }
}
