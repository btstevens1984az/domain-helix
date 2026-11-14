#!/usr/bin/env node
/**
 * Generate animated GIFs for README/docs.
 * Prefers live Puppeteer capture against a running app; falls back to
 * product-faithful SVG frame animation via sharp.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
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
    title: "Identity Fabric",
    subtitle: "Living hybrid graph",
    accent: "#3ecfcf",
  },
  {
    name: "02-dc-health",
    path: "/health",
    title: "DC Health",
    subtitle: "EDR · APM · patch · host",
    accent: "#1fa8a0",
  },
  {
    name: "03-ad-entra-drift",
    path: "/drift",
    title: "AD ↔ Entra Drift",
    subtitle: "Orphans · licenses · groups",
    accent: "#e6a23c",
  },
  {
    name: "04-certificate-intelligence",
    path: "/certificates",
    title: "Certificate Intelligence",
    subtitle: "Expiry · weak crypto",
    accent: "#3dd68c",
  },
  {
    name: "05-remediation-playbooks",
    path: "/playbooks",
    title: "Remediation Playbooks",
    subtitle: "Approval-gated actions",
    accent: "#e86a5c",
  },
  {
    name: "06-secure-login",
    path: "/login",
    title: "Secure Login",
    subtitle: "Breakglass · AD · Entra · SAML",
    accent: "#3ecfcf",
    publicOnly: false,
  },
];

function frameSvg(scene, frame, total) {
  const t = frame / Math.max(1, total - 1);
  const pulse = 0.5 + 0.5 * Math.sin(t * Math.PI * 2);
  const shift = Math.round(t * 40);
  const nodes = [
    [180, 160, "PHX-DC01", "#3dd68c"],
    [420, 140, "DAL-DC01", "#e6a23c"],
    [660, 180, "LON-DC01", "#f07178"],
    [300, 320, "Entra", "#3ecfcf"],
    [540, 340, "AD CS", "#1fa8a0"],
  ];
  const nodeCircles = nodes
    .map(([x, y, label, color], i) => {
      const dx = Math.sin(t * 6 + i) * 6;
      const dy = Math.cos(t * 5 + i) * 4;
      const r = 18 + (i === 2 ? pulse * 4 : 0);
      return `
        <circle cx="${x + dx}" cy="${y + dy}" r="${r}" fill="${color}" fill-opacity="0.2" stroke="${color}" stroke-width="2"/>
        <text x="${x + dx}" y="${y + dy + 36}" text-anchor="middle" fill="#9db0bc" font-size="12" font-family="IBM Plex Sans, sans-serif">${label}</text>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#070b10"/>
      <stop offset="55%" stop-color="#0c141c"/>
      <stop offset="100%" stop-color="#081018"/>
    </linearGradient>
    <radialGradient id="glow" cx="20%" cy="10%" r="55%">
      <stop offset="0%" stop-color="rgba(31,168,160,0.28)"/>
      <stop offset="100%" stop-color="rgba(31,168,160,0)"/>
    </radialGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <rect width="1280" height="720" fill="url(#glow)"/>
  <rect x="40" y="40" width="220" height="640" rx="18" fill="rgba(16,24,34,0.85)" stroke="rgba(120,160,180,0.15)"/>
  <text x="70" y="90" fill="#e8f0f4" font-size="20" font-family="Sora, sans-serif" font-weight="600">DomainHelix</text>
  <text x="70" y="114" fill="#6b7f8c" font-size="11" font-family="IBM Plex Sans, sans-serif" letter-spacing="2">HYBRID IDENTITY TWIN</text>
  ${["Identity Fabric", "DC Health", "AD ↔ Entra Drift", "Certificates", "Playbooks", "Reports", "Settings"]
    .map(
      (label, i) =>
        `<text x="70" y="${160 + i * 36}" fill="${i === 0 ? scene.accent : "#9db0bc"}" font-size="13" font-family="IBM Plex Sans, sans-serif">${label}</text>`
    )
    .join("")}
  <rect x="290" y="40" width="950" height="640" rx="18" fill="rgba(14,22,32,0.9)" stroke="rgba(120,160,180,0.12)"/>
  <text x="320" y="90" fill="#e8f0f4" font-size="28" font-family="Sora, sans-serif" font-weight="600">${scene.title}</text>
  <text x="320" y="118" fill="#9db0bc" font-size="14" font-family="IBM Plex Sans, sans-serif">${scene.subtitle}</text>
  <g transform="translate(${290 + shift * 0.2}, 40)">
    ${scene.name.includes("login")
      ? `
      <rect x="260" y="180" width="420" height="320" rx="20" fill="rgba(10,16,22,0.95)" stroke="${scene.accent}" stroke-opacity="0.45"/>
      <text x="470" y="230" text-anchor="middle" fill="#e8f0f4" font-size="22" font-family="Sora, sans-serif">Sign in</text>
      <text x="470" y="258" text-anchor="middle" fill="#9db0bc" font-size="12" font-family="IBM Plex Sans, sans-serif">Breakglass · AD · Entra · SAML</text>
      <rect x="310" y="290" width="320" height="40" rx="10" fill="#0a1016" stroke="rgba(120,160,180,0.25)"/>
      <rect x="310" y="350" width="320" height="40" rx="10" fill="#0a1016" stroke="rgba(120,160,180,0.25)"/>
      <rect x="310" y="420" width="320" height="44" rx="12" fill="${scene.accent}"/>
      <text x="470" y="448" text-anchor="middle" fill="#041016" font-size="14" font-family="Sora, sans-serif" font-weight="600">Continue</text>
      `
      : `
      <line x1="200" y1="180" x2="440" y2="160" stroke="#3ecfcf" stroke-width="2" stroke-opacity="${0.4 + pulse * 0.4}">
        <animate attributeName="stroke-dasharray" values="0,12;12,0" dur="1s" repeatCount="indefinite"/>
      </line>
      <line x1="440" y1="160" x2="680" y2="200" stroke="#e6a23c" stroke-width="2" stroke-opacity="0.7"/>
      <line x1="300" y1="340" x2="200" y2="180" stroke="#1fa8a0" stroke-width="1.5" stroke-opacity="0.6"/>
      ${nodeCircles}
      <rect x="720" y="150" width="220" height="120" rx="14" fill="rgba(0,0,0,0.35)" stroke="rgba(120,160,180,0.2)"/>
      <text x="740" y="185" fill="#e8f0f4" font-size="16" font-family="Sora, sans-serif">Score ${Math.round(70 + pulse * 20)}</text>
      <text x="740" y="210" fill="#9db0bc" font-size="12" font-family="IBM Plex Sans, sans-serif">Replication · EDR · Patch</text>
      <text x="740" y="235" fill="${scene.accent}" font-size="12" font-family="IBM Plex Mono, monospace">live ${frame + 1}/${total}</text>
      `}
  </g>
</svg>`;
}

async function writeGifFromFrames(name, frames) {
  // sharp can output animated webp; for GIF we assemble via gif-friendly PNG sequence + ffmpeg if present,
  // otherwise write animated webp and also a high-quality PNG fallback renamed for docs embed.
  const tmp = path.join(outDir, `.tmp-${name}`);
  await fs.mkdir(tmp, { recursive: true });
  const pngPaths = [];
  for (let i = 0; i < frames.length; i++) {
    const png = path.join(tmp, `frame-${String(i).padStart(3, "0")}.png`);
    await sharp(Buffer.from(frames[i])).png().toFile(png);
    pngPaths.push(png);
  }

  const gifPath = path.join(outDir, `${name}.gif`);
  const publicPath = path.join(publicDir, `${name}.gif`);

  // Try ffmpeg for true GIF
  const { spawnSync } = await import("node:child_process");
  const ff = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-framerate",
      "6",
      "-i",
      path.join(tmp, "frame-%03d.png"),
      "-vf",
      "scale=1280:-1:flags=lanczos",
      "-loop",
      "0",
      gifPath,
    ],
    { encoding: "utf8" }
  );

  if (ff.status !== 0) {
    // Fallback: create an animated WebP and also copy first+last blended as GIF-like via sharp join
    // Many README renderers accept GIF; synthesize a simple multi-page GIF using gifenc-less approach:
    // Write webp animation and a static preview, plus use `magick` if available.
    const magick = spawnSync(
      "magick",
      ["-delay", "16", "-loop", "0", ...pngPaths, gifPath],
      { encoding: "utf8" }
    );
    if (magick.status !== 0) {
      // Final fallback: encode animated webp and duplicate as .gif extension won't work;
      // instead produce a short "flipbook" GIF by writing only via sharp to webp then note.
      const webp = path.join(outDir, `${name}.webp`);
      await sharp(pngPaths[0], { animated: false })
        .toFormat("png")
        .toFile(path.join(outDir, `${name}-preview.png`));
      // Stitch a pseudo-gif: use first frame repeatedly is bad; try `gifski` then give up to PNG sequence zip.
      const gifski = spawnSync("gifski", ["-o", gifPath, "--fps", "6", ...pngPaths], {
        encoding: "utf8",
      });
      if (gifski.status !== 0) {
        // Create a very simple animated GIF manually (GIF89a) with two frames using sharp raw — use png copy named gif for CI visibility? Better: install gifencoder via dynamic import if present.
        try {
          const { default: GIFEncoder } = await import("gifencoder");
          const { createWriteStream } = await import("node:fs");
          const encoder = new GIFEncoder(1280, 720);
          const stream = encoder.createReadStream().pipe(createWriteStream(gifPath));
          encoder.start();
          encoder.setRepeat(0);
          encoder.setDelay(160);
          encoder.setQuality(12);
          for (const p of pngPaths) {
            const { data, info } = await sharp(p)
              .ensureAlpha()
              .raw()
              .toBuffer({ resolveWithObject: true });
            encoder.addFrame(data);
            void info;
          }
          encoder.finish();
          await new Promise((resolve, reject) => {
            stream.on("finish", resolve);
            stream.on("error", reject);
          });
        } catch {
          // Last resort: copy frames into an animated PNG-compatible sequence by writing webp and a single PNG; also write gif as first frame so README still shows something while we npm install gifencoder
          await sharp(pngPaths[0]).toFile(gifPath);
          await sharp(pngPaths[0]).webp({ quality: 80 }).toFile(webp);
          console.warn(`Wrote static fallback for ${name} (install ffmpeg or gifencoder for animation)`);
        }
      }
    }
  }

  await fs.copyFile(gifPath, publicPath).catch(() => undefined);
  await fs.rm(tmp, { recursive: true, force: true });
  console.log("Wrote", gifPath);
}

async function tryLiveCapture() {
  let puppeteer;
  try {
    puppeteer = await import("puppeteer");
  } catch {
    return false;
  }

  let browser;
  try {
    browser = await puppeteer.default.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

    // Login
    await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle2", timeout: 20000 });
    await page.type('input[type="text"], input:not([type])', email, { delay: 10 }).catch(() => undefined);
    const inputs = await page.$$("input");
    if (inputs[0]) {
      await inputs[0].click({ clickCount: 3 });
      await inputs[0].type(email, { delay: 5 });
    }
    if (inputs[1]) {
      await inputs[1].click({ clickCount: 3 });
      await inputs[1].type(password, { delay: 5 });
    }
    // Capture login frames first
    const loginFrames = [];
    for (let i = 0; i < 8; i++) {
      loginFrames.push(await page.screenshot({ type: "png" }));
      await page.waitForTimeout?.(120);
      await new Promise((r) => setTimeout(r, 120));
    }
    await writeGifFromPngBuffers("06-secure-login", loginFrames);

    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 20000 }).catch(() => undefined);

    for (const scene of scenes.filter((s) => s.path !== "/login")) {
      await page.goto(`${baseUrl}${scene.path}`, { waitUntil: "networkidle2", timeout: 20000 });
      const frames = [];
      for (let i = 0; i < 10; i++) {
        // nudge UI for motion
        await page.mouse.move(400 + i * 30, 300 + (i % 3) * 20);
        await new Promise((r) => setTimeout(r, 180));
        frames.push(await page.screenshot({ type: "png" }));
      }
      await writeGifFromPngBuffers(scene.name, frames);
    }
    await browser.close();
    return true;
  } catch (err) {
    console.warn("Live capture failed, using synthetic GIFs:", err.message || err);
    if (browser) await browser.close().catch(() => undefined);
    return false;
  }
}

async function writeGifFromPngBuffers(name, buffers) {
  const tmp = path.join(outDir, `.tmp-${name}`);
  await fs.mkdir(tmp, { recursive: true });
  const pngPaths = [];
  for (let i = 0; i < buffers.length; i++) {
    const png = path.join(tmp, `frame-${String(i).padStart(3, "0")}.png`);
    await sharp(buffers[i]).resize(1280, 720, { fit: "cover" }).png().toFile(png);
    pngPaths.push(png);
  }
  // Reuse SVG path writer by reading files
  const frames = [];
  for (const p of pngPaths) {
    // convert back through sharp to keep pipeline — actually call ffmpeg directly
    frames.push(await fs.readFile(p));
  }
  void frames;
  const gifPath = path.join(outDir, `${name}.gif`);
  const { spawnSync } = await import("node:child_process");
  let ok =
    spawnSync(
      "ffmpeg",
      ["-y", "-framerate", "6", "-i", path.join(tmp, "frame-%03d.png"), "-vf", "scale=1280:-1:flags=lanczos", "-loop", "0", gifPath],
      { encoding: "utf8" }
    ).status === 0;
  if (!ok) {
    ok =
      spawnSync("gifski", ["-o", gifPath, "--fps", "6", ...pngPaths], { encoding: "utf8" })
        .status === 0;
  }
  if (!ok) {
    try {
      const { default: GIFEncoder } = await import("gifencoder");
      const { createWriteStream } = await import("node:fs");
      const meta = await sharp(pngPaths[0]).metadata();
      const encoder = new GIFEncoder(meta.width || 1280, meta.height || 720);
      const stream = encoder.createReadStream().pipe(createWriteStream(gifPath));
      encoder.start();
      encoder.setRepeat(0);
      encoder.setDelay(160);
      encoder.setQuality(10);
      for (const p of pngPaths) {
        const { data } = await sharp(p).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        encoder.addFrame(data);
      }
      encoder.finish();
      await new Promise((resolve, reject) => {
        stream.on("finish", resolve);
        stream.on("error", reject);
      });
      ok = true;
    } catch {
      await sharp(pngPaths[0]).toFile(gifPath);
    }
  }
  await fs.copyFile(gifPath, path.join(publicDir, `${name}.gif`)).catch(() => undefined);
  await fs.rm(tmp, { recursive: true, force: true });
  console.log("Wrote", gifPath);
}

async function syntheticAll() {
  for (const scene of scenes) {
    const total = 12;
    const frames = [];
    for (let i = 0; i < total; i++) {
      frames.push(frameSvg(scene, i, total));
    }
    await writeGifFromFrames(scene.name, frames);
  }
}

const live = await tryLiveCapture();
if (!live) {
  await syntheticAll();
}

// Remove obsolete connectors assets if present
for (const f of ["06-connectors.png", "06-connectors.svg", "06-connectors.gif"]) {
  await fs.rm(path.join(outDir, f), { force: true });
}

console.log("GIF generation complete.");
