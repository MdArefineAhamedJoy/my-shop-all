import { createHash } from "node:crypto";

/** Stable IDs keep the complete fixture graph separate from ordinary store data. */
export function demoId(key: string): string {
  const hex = createHash("sha256")
    .update(`myshop-demo-v1:${key}`)
    .digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

export const demoCustomers = [
  ["Ayan", "Dhaka", "1207"],
  ["Nila", "Chattogram", "4000"],
  ["Rafi", "Sylhet", "3100"],
  ["Mira", "Rajshahi", "6000"],
  ["Sami", "Khulna", "9000"],
  ["Tisha", "Barishal", "8200"],
  ["Arif", "Rangpur", "5400"],
  ["Sara", "Mymensingh", "2200"],
  ["Nabil", "Cumilla", "3500"],
  ["Rina", "Dhaka", "1216"],
  ["Iman", "Sylhet", "3100"],
  ["Dina", "Chattogram", "4100"],
] as const;

export const demoCategories = [
  "Shirts",
  "Pants",
  "T-Shirts",
  "Dresses",
  "Kurtis",
  "Outerwear",
  "Baby",
  "Accessories",
  "Polos",
  "Caps",
  "Tops",
  "Skirts",
  "Shoes",
];
export const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export interface DemoProduct {
  name: string;
  category: string;
  gender: "men" | "women" | "unisex";
  price: number;
  colors: string[];
  sizes: string[];
  image: string;
}

const top = ["S", "M", "L", "XL"];
const pants = ["30", "32", "34", "36"];
const item = (
  name: string,
  category: string,
  gender: DemoProduct["gender"],
  price: number,
  image: string,
  colors: string[],
  sizes = top,
): DemoProduct => ({ name, category, gender, price, image, colors, sizes });

// Images are bundled development assets, served through the ordinary media API.
export const demoProducts: DemoProduct[] = [
  item("Premium Navy Cotton Shirt", "Shirts", "men", 1899, "navy-shirt", [
    "navy",
    "white",
  ]),
  item("Relaxed Linen Shirt", "Shirts", "men", 1599, "linen-shirt", [
    "beige",
    "white",
  ]),
  item(
    "Khaki Slim Chino Pants",
    "Pants",
    "men",
    2199,
    "chino-pants",
    ["khaki", "navy"],
    pants,
  ),
  item("Blue Oxford Button-Down", "Shirts", "men", 1699, "oxford-shirt", [
    "blue",
    "white",
  ]),
  item(
    "Dark Wash Denim Jeans",
    "Pants",
    "men",
    2499,
    "denim-jeans",
    ["indigo", "black"],
    pants,
  ),
  item("Burgundy Pique Polo", "T-Shirts", "men", 1399, "polo-shirt", [
    "burgundy",
    "navy",
  ]),
  item(
    "Olive Utility Cargo Pants",
    "Pants",
    "men",
    2299,
    "cargo-pants",
    ["olive", "black"],
    pants,
  ),
  item("Charcoal Cotton Henley", "T-Shirts", "men", 1199, "henley-shirt", [
    "charcoal",
    "navy",
  ]),
  item(
    "Grey Tailored Trousers",
    "Pants",
    "men",
    2599,
    "dress-trousers",
    ["grey", "black"],
    pants,
  ),
  item("Striped Weekend Shirt", "Shirts", "men", 1499, "striped-shirt", [
    "blue",
    "white",
  ]),
  item(
    "Black Everyday Joggers",
    "Pants",
    "unisex",
    1799,
    "jogger-pants",
    ["black", "grey"],
    top,
  ),
  item("Plaid Flannel Overshirt", "Outerwear", "men", 1999, "flannel-shirt", [
    "red",
    "navy",
  ]),
  item("Essential White Crew Tee", "T-Shirts", "unisex", 799, "white-tee", [
    "white",
    "black",
  ]),
  item("Graphic Cotton T-Shirt", "T-Shirts", "unisex", 1099, "graphic-tee", [
    "black",
    "white",
  ]),
  item("Grey V-Neck T-Shirt", "T-Shirts", "men", 999, "vneck-tee", [
    "grey",
    "navy",
  ]),
  item(
    "Oversized Heavy Cotton Tee",
    "T-Shirts",
    "unisex",
    1499,
    "oversized-tee",
    ["beige", "black"],
  ),
  item("Floral Summer Midi Dress", "Dresses", "women", 2799, "women-dress", [
    "pink",
    "blue",
  ]),
  item("Elegant Evening Dress", "Dresses", "women", 3499, "women-dress", [
    "black",
    "navy",
  ]),
  item("Linen Everyday Midi Dress", "Dresses", "women", 2599, "women-style", [
    "beige",
    "olive",
  ]),
  item("Cotton Printed Kurti", "Kurtis", "women", 1899, "women-style", [
    "blue",
    "pink",
  ]),
  item("Embroidered Festive Kurti", "Kurtis", "women", 2899, "women-style", [
    "maroon",
    "navy",
  ]),
  item("Relaxed Women's Linen Shirt", "Shirts", "women", 1799, "linen-shirt", [
    "white",
    "beige",
  ]),
  item(
    "Women's Wide-Leg Trousers",
    "Pants",
    "women",
    2399,
    "dress-trousers",
    ["black", "beige"],
    top,
  ),
  item(
    "Lightweight Layering Jacket",
    "Outerwear",
    "women",
    3299,
    "women-style",
    ["beige", "black"],
  ),
  item(
    "Baby Cotton Romper",
    "Baby",
    "unisex",
    899,
    "baby",
    ["white", "blue"],
    ["0-3M", "3-6M", "6-12M"],
  ),
  item(
    "Baby Soft Sleepsuit",
    "Baby",
    "unisex",
    1099,
    "baby",
    ["white", "pink"],
    ["0-3M", "3-6M", "6-12M"],
  ),
  item(
    "Toddler Cotton Outfit",
    "Baby",
    "unisex",
    1299,
    "baby",
    ["blue", "beige"],
    ["1Y", "2Y", "3Y"],
  ),
  item(
    "Baby Gift Essentials Set",
    "Baby",
    "unisex",
    1599,
    "baby",
    ["white", "beige"],
    ["0-3M", "3-6M"],
  ),
  item(
    "Everyday Canvas Backpack",
    "Accessories",
    "unisex",
    1899,
    "backpack",
    ["black", "navy"],
    ["One Size"],
  ),
  item(
    "Weekend Travel Backpack",
    "Accessories",
    "unisex",
    2499,
    "backpack",
    ["olive", "black"],
    ["One Size"],
  ),
  item(
    "Classic Cotton Baseball Cap",
    "Accessories",
    "unisex",
    699,
    "cap",
    ["black", "beige"],
    ["One Size"],
  ),
  item(
    "Everyday Casual Sneakers",
    "Accessories",
    "unisex",
    2999,
    "sneakers",
    ["red", "black"],
    ["39", "40", "41", "42"],
  ),
];

// Keep the original product positions stable: orders and stock use their IDs.
// Shared categories have ten products available to both gender filters.
const additionalCategories: DemoProduct[] = [
  item("Cotton Pique Polo", "Polos", "unisex", 1399, "polo-shirt", [
    "navy",
    "white",
  ]),
  item(
    "Cotton Baseball Cap",
    "Caps",
    "unisex",
    699,
    "cap",
    ["black", "beige"],
    ["One Size"],
  ),
  item("Linen Blouse", "Tops", "women", 1599, "women-style", ["white", "pink"]),
  item("Pleated Midi Skirt", "Skirts", "women", 1999, "women-dress", [
    "navy",
    "beige",
  ]),
  item(
    "Canvas Sneakers",
    "Shoes",
    "unisex",
    2499,
    "sneakers",
    ["white", "black"],
    ["38", "39", "40", "41", "42"],
  ),
];
const styles = [
  "Everyday",
  "Classic",
  "Urban",
  "Weekend",
  "Soft",
  "Signature",
  "Modern",
  "Relaxed",
  "Essential",
  "Heritage",
  "Coastal",
  "Minimal",
];
for (const category of demoCategories) {
  const originals = demoProducts.filter(
    (product) => product.category === category,
  );
  const base =
    originals[0] ||
    additionalCategories.find((product) => product.category === category)!;
  const gender = ["Dresses", "Kurtis", "Tops", "Skirts"].includes(category)
    ? "women"
    : "unisex";
  const enough = () => {
    const products = demoProducts.filter(
      (product) => product.category === category,
    );
    return gender === "women"
      ? products.length >= 10
      : ["men", "women"].every(
          (filter) =>
            products.filter(
              (product) =>
                product.gender === filter || product.gender === "unisex",
            ).length >= 10,
        );
  };
  for (let i = 0; !enough(); i++) {
    const template = originals[i % originals.length] || base;
    demoProducts.push({
      ...template,
      name: `${styles[i % styles.length]} ${template.name} - ${category} Edit`,
      gender,
      price: template.price + (i % 4) * 100,
    });
  }
}

export const demoStaff = [
  {
    key: "fulfillment",
    name: "Demo Fulfillment Staff",
    permissions: [
      "catalog:read",
      "inventory:read",
      "orders:read",
      "orders:create",
      "orders:fulfill",
      "customers:read",
      "returns:read",
    ],
  },
  {
    key: "catalog",
    name: "Demo Catalog Staff",
    permissions: [
      "catalog:read",
      "catalog:write",
      "inventory:read",
      "inventory:adjust",
      "content:read",
      "content:write",
    ],
  },
];
