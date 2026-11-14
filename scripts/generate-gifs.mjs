#!/usr/bin/env node
/**
 * Capture DISTINCT animated GIFs from the LIVE DomainHelix UI.
 * Fails hard if localhost is unreachable or login/capture fails —
 * never ships synthetic lookalike placeholders.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "docs", "images");
const publicDir = path.join(root, "public", "screenshots");
const baseUrl = process.env.DOMAINHELIX_URL || "http://localhost:3000";
const email = process.env.BREAKGLASS_EMAIL || "breakglass@domainhelix.local";
const password =
  process.env.BREAKGLASS_PASSWORD || "ChangeMe-DomainHelix-Breakglass-2026!";

await fs.mkdir(outDir, { recursive: true });
await fs.mkdir(publicDir, { recursive: true });

const scenes = [
  {
    name: "01-identity-fabric",
    path: "/graph",
    frames: 24,
    intervalMs: 140,
    waitSelector: ".react-flow",
    hero: true,
  },
  {
    name: "02-dc-health",
    path: "/health",
    frames: 12,
    intervalMs: 160,
    waitSelector: "main",
  },
  {
    name: "03-ad-entra-drift",
    path: "/drift",
    frames: 12,
    intervalMs: 160,
    waitSelector: "main",
  },
  {
    name: "04-certificate-intelligence",
    path: "/certificates",
    frames: 12,
    intervalMs: 160,
    waitSelector: "main",
  },
  {
    name: "05-remediation-playbooks",
    path: "/playbooks",
    frames: 12,
    intervalMs: 160,
    waitSelector: "main",
  },
  {
    name: "06-secure-login",
    path: "/login",
    frames: 10,
    intervalMs: 150,
    waitSelector: "form",
    skipAuth: true,
  },
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function assertLive() {
  const res = await fetch(`${baseUrl}/login`).catch((err) => {
    throw new Error(`App not reachable at ${baseUrl}: ${err.message}`);
  });
  if (!res.ok) throw new Error(`GET /login returned ${res.status}`);
}

async function launchBrowser() {
  const executablePath =
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    puppeteer.executablePath();
  return puppeteer.launch({
    headless: true,
    executablePath,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--window-size=1440,900",
    ],
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
  });
}

async function fillReactInput(page, index, value) {
  await page.evaluate(
    ({ index, value }) => {
      const inputs = document.querySelectorAll("form input");
      const input = inputs[index];
      if (!(input instanceof HTMLInputElement)) {
        throw new Error(`Missing form input at index ${index}`);
      }
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )?.set;
      if (!setter) throw new Error("Cannot access input value setter");
      setter.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    },
    { index, value }
  );
}

async function login(page) {
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle2", timeout: 30000 });
  await page.waitForSelector("form input", { timeout: 15000 });
  await sleep(400);

  await fillReactInput(page, 0, email);
  await fillReactInput(page, 1, password);

  await page.click('button[type="submit"]');

  // Credentials sign-in uses redirect:false then client router.replace
  await page.waitForFunction(
    () => !window.location.pathname.includes("/login"),
    { timeout: 20000 }
  ).catch(() => undefined);

  await sleep(600);
  const url = page.url();
  if (url.includes("/login")) {
    const errText = await page
      .$eval("body", (el) => el.innerText)
      .catch(() => "");
    throw new Error(`Login failed; still on ${url}. Body: ${errText.slice(0, 280)}`);
  }
}

async function animateFabric(page) {
  // Wait for React Flow canvas + animated edges (replication/sync)
  await page.waitForSelector(".react-flow__node", { timeout: 20000 });
  await sleep(1200);

  // Slow pan across the living graph so edges/nodes visibly change position in the GIF
  const box = await page.$eval(".react-flow", (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height };
  });

  await page.mouse.move(box.x, box.y);
  await page.mouse.down();
  for (let i = 0; i < 8; i++) {
    await page.mouse.move(box.x - 40 * i, box.y + (i % 2 === 0 ? 18 : -18), {
      steps: 4,
    });
    await sleep(40);
  }
  await page.mouse.up();
  await sleep(200);

  // Nudge a node so connection lines reflow
  const node = await page.$(".react-flow__node");
  if (node) {
    const nb = await node.boundingBox();
    if (nb) {
      await page.mouse.move(nb.x + nb.width / 2, nb.y + nb.height / 2);
      await page.mouse.down();
      await page.mouse.move(nb.x + nb.width / 2 + 70, nb.y + nb.height / 2 + 40, {
        steps: 10,
      });
      await page.mouse.up();
    }
  }
  await sleep(300);
}

async function captureScene(page, scene) {
  if (scene.skipAuth) {
    // Clear session cookies for a clean login capture
    const client = await page.createCDPSession();
    await client.send("Network.clearBrowserCookies");
  }

  await page.goto(`${baseUrl}${scene.path}`, {
    waitUntil: "networkidle2",
    timeout: 30000,
  });
  if (scene.waitSelector) {
    await page.waitForSelector(scene.waitSelector, { timeout: 20000 });
  }
  await sleep(scene.hero ? 900 : 500);

  if (scene.hero) {
    await animateFabric(page);
  }

  const frames = [];
  for (let i = 0; i < scene.frames; i++) {
    if (scene.hero) {
      // Keep edges animating: gentle pan + hover
      const x = 520 + Math.sin(i / 3) * 90;
      const y = 360 + Math.cos(i / 4) * 50;
      await page.mouse.move(x, y, { steps: 2 });
      if (i % 5 === 0) {
        await page.mouse.wheel({ deltaY: i % 10 === 0 ? -80 : 60 });
      }
    } else if (!scene.skipAuth) {
      await page.mouse.move(480 + (i % 6) * 40, 280 + (i % 4) * 30);
      // Cycle filters / select cards / scroll so each page GIF has visible change
      if (i === 2 || i === 5 || i === 8) {
        await page
          .evaluate((step) => {
            const filters = Array.from(
              document.querySelectorAll("button, [role='tab'], [data-filter]")
            ).filter((b) => {
              const t = (b.textContent || "").trim();
              return /^(all|high|medium|low|Group|Disabled|critical|healthy|degraded)/i.test(
                t
              );
            });
            if (filters.length) {
              const el = filters[step % filters.length];
              if (el instanceof HTMLElement) el.click();
              return;
            }
            const cards = Array.from(
              document.querySelectorAll("main button, main [role='button'], main li, main tr")
            ).filter((el) => el instanceof HTMLElement);
            const card = cards[step % Math.max(cards.length, 1)];
            if (card) card.click();
          }, i)
          .catch(() => undefined);
      }
      if (i === 6) {
        await page.evaluate(() => {
          const main = document.querySelector("main") || document.scrollingElement;
          main?.scrollBy?.(0, 180);
        });
      }
    } else {
      // Login page: lightly cycle method tabs if present
      if (i === 3 || i === 6) {
        await page
          .evaluate((idx) => {
            const tabs = Array.from(
              document.querySelectorAll("button, [role='tab']")
            ).filter((b) => /Breakglass|Active Directory|Entra|SAML/i.test(b.textContent || ""));
            const t = tabs[idx % Math.max(tabs.length, 1)];
            if (t instanceof HTMLElement) t.click();
          }, i)
          .catch(() => undefined);
      }
    }
    await sleep(scene.intervalMs);
    frames.push(await page.screenshot({ type: "png" }));
  }
  return frames;
}

async function writeGif(name, pngBuffers) {
  const tmp = path.join(outDir, `.tmp-${name}`);
  await fs.rm(tmp, { recursive: true, force: true });
  await fs.mkdir(tmp, { recursive: true });

  const pngPaths = [];
  for (let i = 0; i < pngBuffers.length; i++) {
    const png = path.join(tmp, `frame-${String(i).padStart(3, "0")}.png`);
    // Crop to content-ish 1280x720 from 1440x900
    await sharp(pngBuffers[i])
      .extract({ left: 80, top: 60, width: 1280, height: 720 })
      .png()
      .toFile(png);
    pngPaths.push(png);
  }

  // Diversity check: first vs last frame must differ (catches identical/static captures)
  const a = await sharp(pngPaths[0]).raw().toBuffer();
  const b = await sharp(pngPaths[pngPaths.length - 1]).raw().toBuffer();
  let diff = 0;
  const step = 64;
  for (let i = 0; i < a.length; i += step) {
    diff += Math.abs(a[i] - b[i]);
  }
  if (diff < 50) {
    console.warn(
      `Warning: ${name} frames look nearly identical (diff=${diff}); continuing but verify animation.`
    );
  }

  const gifPath = path.join(outDir, `${name}.gif`);
  const palette = path.join(tmp, "palette.png");
  const fps = name.includes("identity") ? 8 : 6;

  const paletteResult = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-framerate",
      String(fps),
      "-i",
      path.join(tmp, "frame-%03d.png"),
      "-vf",
      "palettegen=stats_mode=diff",
      palette,
    ],
    { encoding: "utf8" }
  );
  if (paletteResult.status !== 0) {
    throw new Error(`ffmpeg palettegen failed for ${name}: ${paletteResult.stderr}`);
  }

  const gifResult = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-framerate",
      String(fps),
      "-i",
      path.join(tmp, "frame-%03d.png"),
      "-i",
      palette,
      "-lavfi",
      "paletteuse=dither=bayer:bayer_scale=3",
      "-loop",
      "0",
      gifPath,
    ],
    { encoding: "utf8" }
  );
  if (gifResult.status !== 0) {
    throw new Error(`ffmpeg gif encode failed for ${name}: ${gifResult.stderr}`);
  }

  const stat = await fs.stat(gifPath);
  if (stat.size < 40_000) {
    throw new Error(
      `${name}.gif is suspiciously small (${stat.size} bytes) — likely not a real UI capture`
    );
  }

  await fs.copyFile(gifPath, path.join(publicDir, `${name}.gif`));
  await fs.rm(tmp, { recursive: true, force: true });
  console.log(`Wrote ${gifPath} (${Math.round(stat.size / 1024)} KB)`);
  return gifPath;
}

async function main() {
  await assertLive();
  console.log(`Capturing live UI from ${baseUrl}`);

  const browser = await launchBrowser();
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);

  try {
    // Login GIF first (unauthenticated)
    const loginScene = scenes.find((s) => s.skipAuth);
    const loginFrames = await captureScene(page, loginScene);
    await writeGif(loginScene.name, loginFrames);

    await login(page);

    const hashes = [];
    for (const scene of scenes.filter((s) => !s.skipAuth)) {
      console.log(`Recording ${scene.name} (${scene.path})…`);
      const frames = await captureScene(page, scene);
      await writeGif(scene.name, frames);
      const buf = await fs.readFile(path.join(outDir, `${scene.name}.gif`));
      hashes.push({ name: scene.name, size: buf.length, head: buf.subarray(0, 64).toString("hex") });
    }

    // Ensure GIFs are not byte-identical to each other
    for (let i = 0; i < hashes.length; i++) {
      for (let j = i + 1; j < hashes.length; j++) {
        if (hashes[i].size === hashes[j].size && hashes[i].head === hashes[j].head) {
          throw new Error(
            `GIFs appear identical: ${hashes[i].name} and ${hashes[j].name}`
          );
        }
      }
    }
  } finally {
    await browser.close();
  }

  // Remove obsolete connector assets if present
  for (const f of ["06-connectors.png", "06-connectors.svg", "06-connectors.gif"]) {
    await fs.rm(path.join(outDir, f), { force: true });
    await fs.rm(path.join(publicDir, f), { force: true });
  }

  console.log("Live GIF capture complete.");
}

main().catch((err) => {
  console.error("FATAL: live GIF capture failed — refusing synthetic fallback.");
  console.error(err);
  process.exit(1);
});
