import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import type { Filters } from "@/types/shop";

const single = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value || "";
export function useShopFilters() {
  const params = useLocalSearchParams<{
    gender?: string;
    tag?: string;
    category?: string;
    search?: string;
  }>();
  const [query, setQuery] = useState("");
  const [extra, setExtra] = useState<Filters>({});
  const [draft, setDraft] = useState<Filters>({});
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const gender = single(params.gender),
    tag = single(params.tag),
    category = single(params.category);
  const reset = () => {
    setQuery("");
    setExtra({});
    router.setParams({ gender: "", tag: "", category: "", search: "" });
  };
  const apply = () => {
    if (
      [draft.min, draft.max].some(
        (value) =>
          value && (!Number.isFinite(Number(value)) || Number(value) < 0)
      )
    ) {
      setError("Enter valid prices of zero or more.");
      return;
    }
    if (draft.min && draft.max && Number(draft.min) > Number(draft.max)) {
      setError("Minimum price must be lower than maximum price.");
      return;
    }
    setExtra(draft);
    setVisible(false);
  };
  const title =
    gender === "men"
      ? "Men's Collection"
      : gender === "women"
        ? "Women's Collection"
        : {
            "new-arrival": "New Arrivals",
            trending: "Trending Now",
            bestseller: "Best Sellers",
            sale: "The Sale Edit",
          }[tag] || "The Collection";
  return {
    filters: { ...extra, query, gender, tag, category },
    query,
    setQuery,
    extra,
    draft,
    setDraft,
    visible,
    setVisible,
    error,
    setError,
    reset,
    apply,
    title,
    focusSearch: single(params.search) === "1",
    open: () => {
      setDraft(extra);
      setError("");
      setVisible(true);
    },
  };
}
