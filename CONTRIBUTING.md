# Contributing to DomainHelix

Thanks for helping improve the hybrid identity digital twin.

## Development

```bash
cp .env.example .env
npm install
npm run db:setup
npm run dev
```

Sign in with the breakglass account from `.env` (see [docs/authentication.md](docs/authentication.md)).

## Guidelines

1. Prefer calm, dark-mode-first UI consistent with the Identity Fabric look.
2. Keep demo mode as a first-class path — missing telemetry must degrade gracefully.
3. Do not reintroduce a Connectors product surface or third-party product brand names in user-facing copy.
4. Use generic capability language for health signals (EDR, APM, patch, host).
5. Extend fabric data via `src/lib/fabric.ts` and `src/lib/demo-data.ts`.
6. Auth changes must keep middleware protection and documented env contracts in `.env.example`.
7. Prefer focused PRs with screenshots or GIFs for UI changes (`npm run gifs`).

## Scripts

```bash
npm run lint
npm run build
npm run gifs   # regenerates docs/images animated captures
```

## Roadmap ideas

- Live LDAP + Microsoft Graph inventory beyond demo payloads
- Conditional Access & PIM deep-dive panels
- Multi-forest layout algorithms
- Signed playbook attestation & change windows
