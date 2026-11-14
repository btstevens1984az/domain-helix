# Contributing to DomainHelix

Thank you for helping build a calmer, clearer hybrid identity twin.

## Development

```bash
cp .env.example .env
npm install
npm run db:setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Guidelines

1. Prefer working demoable features over stubs.
2. Keep mock/demo mode as a first-class path — connectors must degrade gracefully.
3. Match the visual language: deep slate/ink, cyan/teal signals, amber warnings — intelligent and calm.
4. Add types for new domain models in `src/types`.
5. Extend connectors via `src/lib/connectors/registry.ts` rather than scattering env checks.
6. Do not commit secrets, live customer data, or production credentials.

## Pull requests

- Keep PRs focused and reviewable.
- Include screenshots for UI changes.
- Update `.env.example` when adding configuration.
- Ensure `npm run build` succeeds.

## Roadmap ideas

- Live LDAP / Microsoft Graph connectors beyond mock mode
- ServiceNow incident creation from anomalies
- Splunk HEC event forwarding
- Conditional Access & PIM deep-dive panels
- Multi-forest topology layouts
- Signed playbook attestation and change windows
