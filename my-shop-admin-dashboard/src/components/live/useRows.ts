"use client";
import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
export function useRows<T>(path: string) {
  const [rows, setRows] = useState<T[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [cursor, setCursor] = useState(""),
    [next, setNext] = useState<string | null>(null),
    [history, setHistory] = useState<string[]>([]);
  const load = useCallback(
    (signal?: AbortSignal) => {
      return fetch(
        `/api/v1/${path}${path.includes("?") ? "&" : "?"}limit=20${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`,
        { cache: "no-store", signal },
      )
        .then(async (res) => {
          const value = await res.json();
          if (signal?.aborted) return;
          if (!res.ok)
            throw new ApiError(
              value.error?.message || "Request failed",
              res.status,
            );
          setRows(value.data);
          setNext(value.meta?.nextCursor || null);
          setError("");
        })
        .catch((e) => {
          if (!signal?.aborted)
            setError(e instanceof Error ? e.message : "Request failed");
        })
        .finally(() => {
          if (!signal?.aborted) setLoading(false);
        });
    },
    [path, cursor],
  );
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);
  return {
    rows,
    error,
    setError,
    loading,
    refresh: () => {
      setLoading(true);
      return load();
    },
    hasPrevious: history.length > 0,
    hasNext: !!next,
    next: () => {
      if (next && !loading) {
        setLoading(true);
        setHistory((h) => [...h, cursor]);
        setCursor(next);
      }
    },
    previous: () => {
      if (loading || !history.length) return;
      setLoading(true);
      setCursor(history.at(-1) || "");
      setHistory((h) => h.slice(0, -1));
    },
  };
}
