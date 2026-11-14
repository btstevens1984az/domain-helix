import puppeteer from "puppeteer";
import { mkdir } from "fs/promises";
import path from "path";

const base = process.env.BASE_URL || "http://localhost:3000";
const outDirs = ["public/screenshots", "docs/images"];

const pages = [
  { path: "/graph", name: "01-identity-fabric" },
  { path: "/health", name: "02-dc-health" },
  { path: "/drift", name: "03-ad-entra-drift" },
  { path: "/certificates", name: "04-certificate-intelligence" },
  { path: "/playbooks", name: "05-remediation-playbooks" },
  { path: "/connectors", name: "06-connectors" },
];

await Promise.all(outDirs.map((d) => mkdir(d, { recursive: true })));

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"],
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
});
const page = await browser.newPage();
await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);

for (const p of pages) {
  await page.goto(`${base}${p.path}`, { waitUntil: "networkidle0", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 2000));
  for (const dir of outDirs) {
    const file = path.join(dir, `${p.name}.png`);
    await page.screenshot({ path: file, type: "png" });
    console.log("wrote", file);
  }
}

await browser.close();
console.log("Screenshots captured.");
