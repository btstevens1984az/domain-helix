# Authentication & security model

DomainHelix is a single Next.js deployable with Auth.js (NextAuth v5). Unauthenticated users cannot reach dashboards or protected APIs.

## Sign-in methods

| Method | When to use | Docs |
| --- | --- | --- |
| **Breakglass local** | Emergency admin access / first boot | this page |
| **Active Directory** | DomainHelix installed on a local server joined or able to reach AD | [active-directory.md](./active-directory.md) |
| **Entra ID (OIDC)** | Azure tenant Enterprise Application | [entra-enterprise-app.md](./entra-enterprise-app.md) |
| **SAML SSO** | Entra SAML, Okta, Ping, OneLogin, Google Workspace, generic SAML 2.0 | [saml-sso.md](./saml-sso.md) |

The login page always surfaces these choices. Methods without configuration appear disabled until env vars are set.

## Breakglass setup & rotation

1. Copy `.env.example` → `.env`.
2. Set strong values:

```bash
BREAKGLASS_EMAIL="breakglass@domainhelix.local"
BREAKGLASS_PASSWORD="use-a-long-unique-passphrase"
AUTH_SECRET="$(openssl rand -base64 48)"
NEXTAUTH_SECRET="$AUTH_SECRET"
NEXTAUTH_URL="https://domainhelix.contoso.local"
```

3. Seed / rotate:

```bash
npm run db:seed
```

The seed upserts the breakglass user with a **bcrypt** password hash (cost factor 12).

4. After first successful login in a shared environment:
   - Change `BREAKGLASS_PASSWORD`
   - Re-run `npm run db:seed`
   - Store the new secret in your vault
   - Restrict who can reach the login UI (network ACL / reverse proxy)

**Default documented credentials (must change):**

- Email: `breakglass@domainhelix.local`
- Password: `ChangeMe-DomainHelix-Breakglass-2026!`

## Session security

- JWT sessions via Auth.js (8-hour max age)
- Cookie: `httpOnly`, `SameSite=Lax`, `Secure` in production
- CSRF protection on Auth.js POST flows
- Audit log entries for successful breakglass / AD / SAML logins

## Route protection

`src/middleware.ts` requires a valid session for all routes except:

- `/login`
- `/api/auth/**` (including SAML ACS/metadata)
- `/api/health/live`
- static assets

APIs return `401` when unauthenticated; UI routes redirect to `/login`.

## Role mapping (least privilege)

Group / role claims map to DomainHelix views:

| Env var | Default groups | Role |
| --- | --- | --- |
| `AUTH_ADMIN_GROUPS` | DomainHelix-Admins, Domain Admins | `admin` |
| `AUTH_SECURITY_GROUPS` | DomainHelix-Security | `security_analyst` |
| `AUTH_INFRA_GROUPS` | DomainHelix-Infra | `infrastructure_owner` |
| _(none matched)_ | — | `identity_engineer` |

Demo mode role switcher only reshapes UI emphasis — it does not grant new backend privileges.

## Security model summary

1. **Never** leave default breakglass passwords on a network-reachable host.
2. Prefer Entra OIDC or SAML for day-to-day access; keep breakglass offline / vaulted.
3. AD bind accounts should be **read-only** directory accounts.
4. Entra Enterprise Apps should request the minimum Graph scopes needed for sign-in + optional group claims.
5. Remediation playbooks that change production state default to **requiresApproval: true**.
6. Do not commit `.env` — only `.env.example`.
