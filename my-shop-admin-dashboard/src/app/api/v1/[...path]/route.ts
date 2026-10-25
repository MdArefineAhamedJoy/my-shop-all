import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/backend-proxy";
export const runtime = "nodejs";
async function handle(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return proxyBackend(req, (await context.params).path, true);
}
export {
  handle as GET,
  handle as POST,
  handle as PUT,
  handle as PATCH,
  handle as DELETE,
};
