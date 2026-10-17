// Bundle the storefront's remote photos for a reliable offline native preview.
const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const root = path.resolve(__dirname, "..");
const sources = ["src/data/products.ts", "src/data/storefront.ts"];
const urls = [
  ...new Set(
    sources.flatMap(
      (file) =>
        fs
          .readFileSync(path.join(root, file), "utf8")
          .match(/https:\/\/images\.unsplash\.com\/[^"'\s]+/g) || []
    )
  ),
];
const manifestPath = path.join(root, "assets/remote-images.json");
const previous = fs.existsSync(manifestPath)
  ? JSON.parse(fs.readFileSync(manifestPath, "utf8"))
  : [];
fs.mkdirSync(path.join(root, "assets/images/remote"), { recursive: true });
(async () => {
  const entries = await Promise.all(
    urls.map(async (url) => {
      const local =
        previous.find((entry) => entry.url === url)?.local ??
        `/images/remote/${createHash("sha256").update(url).digest("hex").slice(0, 16)}.jpg`;
      const file = path.join(root, "assets", local);
      if (!fs.existsSync(file)) {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(30000),
        });
        if (!response.ok) throw new Error(`${response.status}: ${url}`);
        fs.writeFileSync(file, Buffer.from(await response.arrayBuffer()));
      }
      return { url, local };
    })
  );
  fs.writeFileSync(manifestPath, JSON.stringify(entries, null, 2) + "\n");
  await require("./sync-catalog.cjs")();
  console.log(`Bundled ${entries.length} remote storefront photos.`);
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
