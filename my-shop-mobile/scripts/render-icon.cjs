// Render the code-native SVG mark to Expo's required PNG icon sizes.
const { chromium } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");
(async () => {
  const browser = await chromium.launch({ channel: "chrome" });
  const page = await browser.newPage({
    viewport: { width: 1024, height: 1024 },
    deviceScaleFactor: 1,
  });
  const svg = fs.readFileSync(
    path.resolve(__dirname, "../assets/brand-icon.svg"),
    "utf8"
  );
  await page.setContent(
    `<style>body{margin:0}svg{display:block;width:100vw;height:100vh}</style>${svg}`
  );
  await page.screenshot({
    path: path.resolve(__dirname, "../assets/icon.png"),
  });
  await page.setViewportSize({ width: 64, height: 64 });
  await page.screenshot({
    path: path.resolve(__dirname, "../assets/favicon.png"),
  });
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
