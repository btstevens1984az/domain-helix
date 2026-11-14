# DomainHelix Architecture

```mermaid
flowchart TB
  subgraph UI["Next.js App Router UI"]
    Login[Secure Login]
    Graph[Identity Fabric Graph]
    Health[DC Health]
    Drift[AD ↔ Entra Drift]
    Certs[AD CS Intelligence]
    Playbooks[Remediation Playbooks]
    Reports[Exports & Reports]
  end

  subgraph Auth["Auth.js"]
    BG[Breakglass]
    ADAuth[Active Directory LDAP]
    EntraOIDC[Entra OIDC]
    SAML[SAML 2.0 SSO]
  end

  subgraph API["API Routes"]
    REST[REST JSON APIs]
    SSE[SSE Live Stream]
    MW[Session Middleware]
  end

  subgraph Core["Core Services"]
    Score[Health Scoring]
    Demo[Demo Fabric Dataset]
  end

  subgraph Data["Data"]
    Prisma[(Prisma · SQLite / Postgres)]
  end

  subgraph Signals["Health signal domains"]
    Directory[Active Directory / Entra]
    EDR[Endpoint detection / EDR]
    APM[APM / auth latency]
    Patch[Patch & compliance]
    Host[Virtualization / host health]
    CertsSig[Certificate intelligence]
  end

  Login --> Auth
  Auth --> MW
  UI --> API
  MW --> API
  API --> Core
  Core --> Demo
  Core --> Prisma
  Score --> Signals
  SSE --> Graph
```

## Design principles

1. **Graph first** — the identity fabric visualization is the emotional and operational center.
2. **Auth before data** — dashboards and APIs require a valid session.
3. **Graceful degradation** — missing live telemetry never breaks the UI; demo fabric fills gaps.
4. **Calm density** — dark-mode glass surfaces, cyan/teal healthy signals, amber/coral risk.
5. **Safe remediation** — playbooks default to approval workflows.
6. **Single deployable** — Next.js API routes + Prisma; Docker Compose for one-command bring-up.
7. **Vendor-neutral signals** — health factors speak in capability language (EDR, APM, patch, host), not product brands.

## Auth docs

- [authentication.md](./authentication.md)
- [active-directory.md](./active-directory.md)
- [entra-enterprise-app.md](./entra-enterprise-app.md)
- [saml-sso.md](./saml-sso.md)
