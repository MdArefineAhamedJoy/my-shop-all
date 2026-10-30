// Older navigation links used singular names; API categories use these slugs.
const aliases: Record<string, string> = {
  shirt: "shirts",
  "t-shirt": "t-shirts",
  polo: "polos",
  cap: "caps",
  top: "tops",
  dress: "dresses",
  skirt: "skirts",
  accessory: "accessories",
};

export function categorySlug(value: string) {
  const slug = value.toLowerCase();
  return aliases[slug] || slug;
}
