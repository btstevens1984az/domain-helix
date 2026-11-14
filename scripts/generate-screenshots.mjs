/**
 * Generates documentation screenshots from live API data when a browser
 * cannot be launched in the build environment.
 */
import sharp from "sharp";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const base = process.env.BASE_URL || "http://localhost:3000";
const outDirs = ["public/screenshots", "docs/images"];

async function fetchJson(p) {
  const res = await fetch(`${base}${p}`);
  if (!res.ok) throw new Error(`${p} -> ${res.status}`);
  return res.json();
}

function esc(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function healthColor(h) {
  if (h === "healthy") return "#3dd68c";
  if (h === "degraded") return "#e6a23c";
  if (h === "critical") return "#f07178";
  return "#5c7380";
}

function chromeShell({ title, subtitle, body, width = 1440, height = 900 }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#070b10"/>
      <stop offset="55%" stop-color="#0c1219"/>
      <stop offset="100%" stop-color="#0a1017"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1fa8a0"/>
      <stop offset="100%" stop-color="#3ecfcf"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <style>
      .t { font-family: 'Sora', 'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif; fill: #e8f0f4; }
      .m { font-family: 'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif; fill: #9db0bc; }
      .mono { font-family: 'JetBrains Mono', ui-monospace, monospace; fill: #9db0bc; }
      .muted { fill: #6b7f8c; }
      .cyan { fill: #3ecfcf; }
    </style>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <circle cx="180" cy="-40" r="320" fill="#1fa8a0" opacity="0.12"/>
  <circle cx="1280" cy="40" r="260" fill="#3ecfcf" opacity="0.08"/>

  <!-- Sidebar -->
  <rect x="0" y="0" width="240" height="${height}" fill="rgba(18,28,40,0.92)" stroke="rgba(120,160,180,0.12)"/>
  <rect x="20" y="22" width="36" height="36" rx="12" fill="url(#accent)" opacity="0.35"/>
  <text x="68" y="40" class="t" font-size="16" font-weight="600">DomainHelix</text>
  <text x="68" y="56" class="m muted" font-size="9" letter-spacing="2">HYBRID IDENTITY TWIN</text>

  ${["Identity Fabric", "DC Health", "AD ↔ Entra Drift", "Certificates", "Playbooks", "Connectors", "Reports", "Settings"]
    .map((label, i) => {
      const y = 100 + i * 42;
      const active = label === title || (title.includes("Fabric") && i === 0);
      return `<rect x="16" y="${y}" width="208" height="34" rx="12" fill="${
        active ? "rgba(62,207,207,0.12)" : "transparent"
      }" stroke="${active ? "rgba(62,207,207,0.25)" : "transparent"}"/>
      <text x="36" y="${y + 21}" class="t" font-size="12" fill="${
        active ? "#3ecfcf" : "#9db0bc"
      }">${esc(label)}</text>`;
    })
    .join("\n")}

  <!-- Topbar -->
  <text x="268" y="42" class="t" font-size="22" font-weight="600">${esc(title)}</text>
  <text x="268" y="62" class="m" font-size="12">${esc(subtitle)}</text>
  <rect x="1100" y="24" width="120" height="28" rx="14" fill="rgba(62,207,207,0.12)" stroke="rgba(62,207,207,0.3)"/>
  <text x="1160" y="42" text-anchor="middle" class="cyan" font-size="11">Live telemetry</text>
  <rect x="1235" y="24" width="180" height="28" rx="14" fill="rgba(255,255,255,0.04)" stroke="rgba(120,160,180,0.15)"/>
  <text x="1325" y="42" text-anchor="middle" class="m" font-size="10">admin@domainhelix.local</text>

  ${body}
</svg>`;
}

function card(x, y, w, h, content) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="rgba(16,24,34,0.72)" stroke="rgba(120,160,180,0.12)"/>${content}`;
}

async function render(name, svg) {
  for (const dir of outDirs) {
    await mkdir(dir, { recursive: true });
    const svgPath = path.join(dir, `${name}.svg`);
    const pngPath = path.join(dir, `${name}.png`);
    await writeFile(svgPath, svg);
    await sharp(Buffer.from(svg)).png().toFile(pngPath);
    console.log("wrote", pngPath);
  }
}

const [graph, health, drift, certs, connectors] = await Promise.all([
  fetchJson("/api/graph"),
  fetchJson("/api/health"),
  fetchJson("/api/drift"),
  fetchJson("/api/certificates"),
  fetchJson("/api/connectors"),
]);

// 1. Identity Fabric
{
  const dcs = graph.nodes.filter((n) => n.kind === "domain_controller");
  const nodes = dcs.map((n, i) => {
    const x = 320 + (i % 3) * 280;
    const y = 180 + Math.floor(i / 3) * 160;
    const c = healthColor(n.health);
    return `
      <rect x="${x}" y="${y}" width="200" height="90" rx="16" fill="rgba(14,22,32,0.95)" stroke="${c}" stroke-opacity="0.45" filter="url(#glow)"/>
      <circle cx="${x + 28}" cy="${y + 32}" r="10" fill="${c}" opacity="0.9"/>
      <text x="${x + 48}" y="${y + 28}" class="t" font-size="14" font-weight="600">${esc(n.label)}</text>
      <text x="${x + 48}" y="${y + 46}" class="m" font-size="10">${esc(n.subtitle || "")}</text>
      <text x="${x + 20}" y="${y + 72}" class="mono" font-size="11">score ${n.score} · ${n.health}</text>`;
  });
  const edges = `
    <path d="M420 270 C480 300, 520 300, 580 270" stroke="#3dd68c" stroke-width="2" fill="none" opacity="0.7"/>
    <path d="M700 270 C760 320, 800 340, 860 340" stroke="#e6a23c" stroke-width="2" fill="none" opacity="0.8"/>
    <path d="M420 430 C560 480, 700 480, 860 430" stroke="#f07178" stroke-width="2.2" fill="none" opacity="0.85"/>`;
  const stats = [
    ["Avg DC Health", health.summary.avgScore],
    ["Critical DCs", health.summary.criticalDcs],
    ["Drift (high)", health.summary.highDrift],
    ["Cert risk", health.summary.certRisk],
  ]
    .map(
      ([label, value], i) =>
        card(
          268 + i * 280,
          88,
          260,
          70,
          `<text x="${278 + i * 280}" y="112" class="m muted" font-size="10" letter-spacing="1.5">${esc(
            label.toUpperCase()
          )}</text>
       <text x="${278 + i * 280}" y="142" class="t" font-size="28" font-weight="600">${value}</text>`
        )
    )
    .join("");

  await render(
    "01-identity-fabric",
    chromeShell({
      title: "Identity Fabric",
      subtitle: "Living digital twin — Domain Controllers, replication, trusts, Entra Connect, AD CS",
      body: `${stats}
      <rect x="268" y="172" width="860" height="680" rx="16" fill="rgba(6,10,14,0.55)" stroke="rgba(120,160,180,0.12)"/>
      ${edges}${nodes.join("")}
      ${card(
        1150,
        172,
        260,
        400,
        `<text x="1170" y="204" class="t" font-size="14" font-weight="600">Inspect a node</text>
       <text x="1170" y="230" class="m" font-size="11">Click any DC to correlate</text>
       <text x="1170" y="250" class="m" font-size="11">replication, Falcon, BigFix,</text>
       <text x="1170" y="270" class="m" font-size="11">certs, and vSphere health.</text>
       <rect x="1170" y="300" width="220" height="54" rx="12" fill="rgba(0,0,0,0.25)" stroke="rgba(120,160,180,0.12)"/>
       <text x="1185" y="322" class="t" font-size="12">${esc(dcs[0]?.label || "PHX-DC01")}</text>
       <text x="1185" y="340" class="mono" font-size="11">score ${dcs[0]?.score ?? 96}</text>`
      )}`,
    })
  );
}

// 2. DC Health
{
  const rows = health.metrics
    .map((m, i) => {
      const y = 120 + i * 100;
      const c = healthColor(m.level);
      return card(
        268,
        y,
        360,
        88,
        `<text x="288" y="${y + 32}" class="t" font-size="16" font-weight="600">${esc(m.hostname)}</text>
       <text x="288" y="${y + 54}" class="m" font-size="11">lag ${m.replicationLagSeconds}s · LDAP ${Math.round(
          m.ldapLatencyMs
        )} ms</text>
       <text x="560" y="${y + 40}" class="t" font-size="28" font-weight="600">${m.score}</text>
       <circle cx="590" cy="${y + 62}" r="5" fill="${c}"/>
       <text x="602" y="${y + 66}" class="m" font-size="11">${m.level}</text>`
      );
    })
    .join("");

  const active = health.metrics.find((m) => m.level === "critical") || health.metrics[0];
  const anomalies = (active.anomalies || [])
    .slice(0, 3)
    .map(
      (a, i) =>
        `<rect x="680" y="${420 + i * 80}" width="700" height="68" rx="12" fill="rgba(0,0,0,0.2)" stroke="rgba(120,160,180,0.12)"/>
       <text x="700" y="${444 + i * 80}" class="t" font-size="13">${esc(a.title)}</text>
       <text x="700" y="${466 + i * 80}" class="m" font-size="11">${esc(a.detail).slice(0, 90)}</text>`
    )
    .join("");

  await render(
    "02-dc-health",
    chromeShell({
      title: "Domain Controller Health",
      subtitle: "Replication, auth latency, CrowdStrike, BigFix, and host posture",
      body: `${rows}
      ${card(
        660,
        120,
        740,
        260,
        `<text x="680" y="150" class="t" font-size="18" font-weight="600">${esc(active.hostname)}</text>
       <text x="680" y="175" class="m" font-size="12">Kerberos ${Math.round(active.kerberosLatencyMs)} ms · Cert risk ${
          active.certRiskScore
        } · BigFix ${active.bigFixCompliancePct}%</text>
       <path d="M700 250 C780 210, 860 280, 940 230 S1100 200, 1300 240" stroke="#3ecfcf" stroke-width="2.5" fill="none"/>
       <path d="M700 270 C780 300, 860 250, 940 280 S1100 310, 1300 270" stroke="#e6a23c" stroke-width="2" fill="none" opacity="0.85"/>
       <text x="680" y="340" class="m muted" font-size="11">Dynatrace-correlated LDAP / Kerberos latency</text>`
      )}
      ${anomalies}`,
    })
  );
}

// 3. Drift
{
  const left = drift.findings
    .slice(0, 5)
    .map(
      (f, i) =>
        `<rect x="280" y="${140 + i * 120}" width="520" height="100" rx="14" fill="rgba(0,0,0,0.22)" stroke="rgba(120,160,180,0.12)"/>
       <text x="300" y="${170 + i * 120}" class="t" font-size="14">${esc(f.objectName)}</text>
       <text x="300" y="${192 + i * 120}" class="m" font-size="11">${esc(f.type.replaceAll("_", " "))}</text>
       <text x="300" y="${214 + i * 120}" class="m" font-size="11">${esc(f.adSide || "—")}</text>`
    )
    .join("");
  const right = drift.findings
    .slice(0, 5)
    .map(
      (f, i) =>
        `<rect x="840" y="${140 + i * 120}" width="540" height="100" rx="14" fill="rgba(0,0,0,0.22)" stroke="rgba(120,160,180,0.12)"/>
       <text x="860" y="${170 + i * 120}" class="t" font-size="14">${esc(f.objectName)}</text>
       <text x="860" y="${192 + i * 120}" class="m" font-size="11">${esc(f.entraSide || "—")}</text>
       <text x="860" y="${214 + i * 120}" class="m" font-size="11">${esc(f.detail).slice(0, 80)}</text>`
    )
    .join("");

  await render(
    "03-ad-entra-drift",
    chromeShell({
      title: "AD ↔ Entra Drift",
      subtitle: "Side-by-side hybrid identity consistency",
      body: `${card(268, 88, 560, 40, `<text x="288" y="114" class="t" font-size="13">On-premises Active Directory</text>`)}
      ${card(828, 88, 560, 40, `<text x="848" y="114" class="t" font-size="13">Azure Entra ID</text>`)}
      ${left}${right}`,
    })
  );
}

// 4. Certificates
{
  const tiles = certs.certificates
    .slice(0, 10)
    .map((c, i) => {
      const x = 280 + (i % 5) * 220;
      const y = 160 + Math.floor(i / 5) * 130;
      const col =
        c.daysRemaining <= 14 ? "#f07178" : c.daysRemaining <= 45 ? "#e6a23c" : "#3dd68c";
      return `<rect x="${x}" y="${y}" width="200" height="110" rx="14" fill="rgba(8,12,18,0.7)" stroke="${col}" stroke-opacity="0.35"/>
      <circle cx="${x + 22}" cy="${y + 28}" r="6" fill="${col}"/>
      <text x="${x + 38}" y="${y + 32}" class="t" font-size="12">${esc(c.name).slice(0, 18)}</text>
      <text x="${x + 20}" y="${y + 70}" class="mono" font-size="12">${c.daysRemaining}d · risk ${c.riskScore}</text>
      <text x="${x + 20}" y="${y + 92}" class="m muted" font-size="10">${c.kind} · ${c.hashAlgorithm}</text>`;
    })
    .join("");

  await render(
    "04-certificate-intelligence",
    chromeShell({
      title: "Certificate Authority Intelligence",
      subtitle: "AD CS templates, issued certs, expiration heatmaps, and risk scoring",
      body: `${Object.entries(certs.riskBuckets)
        .map(
          ([k, v], i) =>
            card(
              268 + i * 280,
              88,
              260,
              54,
              `<text x="${284 + i * 280}" y="112" class="m muted" font-size="10">${esc(
                k.toUpperCase()
              )} RISK</text>
           <text x="${284 + i * 280}" y="132" class="t" font-size="20" font-weight="600">${v}</text>`
            )
        )
        .join("")}${tiles}`,
    })
  );
}

// 5. Playbooks
{
  const playbooks = [
    ["Force AD Replication", "powershell", "low"],
    ["Renew DC Authentication Certificate", "powershell", "medium"],
    ["Deploy Critical BigFix Patches", "ansible", "high"],
    ["Trigger Entra Connect Delta Sync", "powershell", "low"],
  ];
  const cards = playbooks
    .map((p, i) => {
      const y = 120 + i * 110;
      const c = p[2] === "high" ? "#f07178" : p[2] === "medium" ? "#e6a23c" : "#3dd68c";
      return card(
        268,
        y,
        520,
        96,
        `<text x="288" y="${y + 34}" class="t" font-size="15">${esc(p[0])}</text>
       <text x="288" y="${y + 58}" class="m" font-size="11">${esc(p[1])} · approval workflow</text>
       <rect x="680" y="${y + 28}" width="70" height="24" rx="12" fill="${c}" fill-opacity="0.18" stroke="${c}" stroke-opacity="0.4"/>
       <text x="715" y="${y + 44}" text-anchor="middle" font-size="11" fill="${c}">${p[2]}</text>`
      );
    })
    .join("");

  await render(
    "05-remediation-playbooks",
    chromeShell({
      title: "Remediation Playbooks",
      subtitle: "PowerShell, Ansible, and SSH — with safe approval workflows",
      body: `${cards}
      ${card(
        820,
        120,
        560,
        520,
        `<text x="840" y="156" class="t" font-size="16">Force AD Replication</text>
       <rect x="840" y="180" width="520" height="300" rx="12" fill="#060a0e" stroke="rgba(120,160,180,0.12)"/>
       <text x="860" y="210" class="cyan" font-size="12" font-family="JetBrains Mono, monospace">param([string]$SourceDC, [string]$TargetDC)</text>
       <text x="860" y="234" class="cyan" font-size="12" font-family="JetBrains Mono, monospace">repadmin /replicate $TargetDC $SourceDC ...</text>
       <text x="860" y="258" class="cyan" font-size="12" font-family="JetBrains Mono, monospace">repadmin /showrepl $TargetDC /csv</text>
       <rect x="840" y="510" width="140" height="36" rx="10" fill="url(#accent)"/>
       <text x="910" y="532" text-anchor="middle" class="t" font-size="12" fill="#041016" font-weight="600">Request run</text>`
      )}`,
    })
  );
}

// 6. Connectors
{
  const tiles = connectors.connectors
    .map((c, i) => {
      const x = 280 + (i % 3) * 360;
      const y = 120 + Math.floor(i / 3) * 220;
      const col = healthColor(c.status === "unconfigured" ? "unknown" : c.status);
      return card(
        x,
        y,
        340,
        190,
        `<text x="${x + 24}" y="${y + 40}" class="t" font-size="16">${esc(c.name)}</text>
       <rect x="${x + 240}" y="${y + 22}" width="80" height="24" rx="12" fill="${col}" fill-opacity="0.16" stroke="${col}" stroke-opacity="0.35"/>
       <text x="${x + 280}" y="${y + 38}" text-anchor="middle" font-size="10" fill="${col}">${esc(
          c.status
        )}</text>
       <text x="${x + 24}" y="${y + 78}" class="m" font-size="12">${esc(c.description).slice(0, 70)}...</text>
       <text x="${x + 24}" y="${y + 120}" class="m muted" font-size="11">${esc(c.message).slice(0, 60)}</text>
       <text x="${x + 24}" y="${y + 160}" class="cyan" font-size="11">${c.mockMode ? "mock mode" : "live"}</text>`
      );
    })
    .join("");

  await render(
    "06-connectors",
    chromeShell({
      title: "Connector Framework",
      subtitle: "Extensible integrations with graceful degradation and mock mode",
      body: tiles,
    })
  );
}

console.log("Documentation screenshots generated from live API data.");
