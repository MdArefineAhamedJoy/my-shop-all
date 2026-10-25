import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import SessionActions from "./SessionActions";
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieName = `${process.env.NODE_ENV === "production" ? "__Host-" : ""}shop_admin_session`;
  const session = (await cookies()).get(cookieName)?.value;
  if (!session) redirect("/login");
  const response = await fetch(
    `${process.env.API_INTERNAL_URL || "http://127.0.0.1:4000/v1"}/auth/session`,
    {
      headers: { authorization: `Session ${session}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    },
  );
  if (response.status === 401 || response.status === 403) redirect("/login");
  if (!response.ok) throw new Error("The shop service is unavailable");
  const { data: user } = await response.json();
  if (!["admin", "staff"].includes(user.role)) redirect("/login");
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-10">
        <SessionActions name={user.name} />
        {children}
      </main>
    </div>
  );
}
