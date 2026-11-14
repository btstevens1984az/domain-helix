# DomainHelix Architecture

```mermaid
flowchart TB
  subgraph UI["Next.js App Router UI"]
    Graph[Identity Fabric Graph]
    Health[DC Health]
    Drift[AD ↔ Entra Drift]
    Certs[AD CS Intelligence]
    Playbooks[Remediation Playbooks]
    Reports[Exports & Reports]
  end

  subgraph API["API Routes"]
    REST[REST JSON APIs]
    SSE[SSE Live Stream]
  end

  subgraph Core["Core Services"]
    Score[Health Scoring]
    Demo[Demo Fabric Dataset]
    Conn[Connector Registry]
  end

  subgraph Data["Data"]
    Prisma[(Prisma · SQLite / Postgres)]
  end

  subgraph External["Connectors — mock or live"]
    AD[Active Directory]
    Entra[Entra ID]
    CS[CrowdStrike]
    DT[Dynatrace]
    BF[BigFix]
    VM[vCenter]
    SNOW[ServiceNow]
    SPL[Splunk]
  end

  UI --> API
  API --> Core
  Conn --> External
  Core --> Demo
  Core --> Prisma
  Score --> Health
  SSE --> Graph
```

## Design principles

1. **Graph first** — the identity fabric visualization is the emotional and operational center.
2. **Graceful degradation** — missing credentials never break the UI; mock mode fills gaps.
3. **Calm density** — dark-mode glass surfaces, cyan/teal healthy signals, amber/coral risk.
4. **Safe remediation** — playbooks default to approval workflows.
5. **Single deployable** — Next.js API routes + Prisma; Docker Compose for one-command bring-up.
