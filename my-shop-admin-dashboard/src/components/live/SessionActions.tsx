"use client";
import { api } from "@/lib/api";
export default function SessionActions({ name }: { name: string }) {
  return (
    <div className="flex gap-4 items-center justify-end text-sm mb-5">
      <span>{name}</span>
      <button
        className="underline"
        onClick={async () => {
          await api("auth/logout", { method: "POST" });
          location.assign("/login");
        }}
      >
        Sign out
      </button>
    </div>
  );
}
