# Entra ID Enterprise Application (OIDC)

Connect a **locally installed** DomainHelix instance to an Azure AD / Entra ID tenant using OpenID Connect.

## Overview

1. Register DomainHelix as an **App registration** / Enterprise Application in Entra.
2. Configure redirect URI to your on-prem / private URL.
3. Set `ENTRA_*` env vars on the DomainHelix server.
4. Users choose **Entra ID (OIDC)** on the login page.

## 1. Register the application

In [Microsoft Entra admin center](https://entra.microsoft.com):

1. **Identity** → **Applications** → **App registrations** → **New registration**
2. Name: `DomainHelix`
3. Supported account types: **Accounts in this organizational directory only** (single tenant) unless you intentionally multi-tenant
4. Redirect URI (Web):

```
https://domainhelix.contoso.local/api/auth/callback/microsoft-entra-id
```

For local development:

```
http://localhost:3000/api/auth/callback/microsoft-entra-id
```

5. Register and note:
   - **Application (client) ID** → `ENTRA_CLIENT_ID`
   - **Directory (tenant) ID** → `ENTRA_TENANT_ID`

## 2. Client secret or federated credentials

### Option A — Client secret

1. **Certificates & secrets** → **New client secret**
2. Copy the value once → `ENTRA_CLIENT_SECRET`
3. Store in a vault; rotate on a schedule

### Option B — Federated credentials (preferred for cloud-hosted runners)

1. **Certificates & secrets** → **Federated credentials**
2. Configure workload identity as appropriate for your host
3. Set `ENTRA_FEDERATED_CREDENTIAL=true` and omit or placeholder the secret only if your runtime injects tokens (advanced)

For most on-prem installs, use **Option A**.

## 3. API permissions

Under **API permissions** → **Microsoft Graph**:

| Permission | Type | Required? |
| --- | --- | --- |
| `openid` | Delegated | Yes |
| `profile` | Delegated | Yes |
| `email` | Delegated | Yes |
| `User.Read` | Delegated | Yes |
| `GroupMember.Read.All` | Delegated | Optional — only if mapping Entra groups to DomainHelix roles |

Click **Grant admin consent** for the tenant.

## 4. Optional group claims (role mapping)

**Token configuration** → **Add groups claim**:

- Security groups
- Emit as group IDs or names (prefer names/CNs that match `AUTH_*_GROUPS`)

Map those groups with:

```bash
AUTH_ADMIN_GROUPS="DomainHelix-Admins"
AUTH_SECURITY_GROUPS="DomainHelix-Security"
AUTH_INFRA_GROUPS="DomainHelix-Infra"
```

## 5. DomainHelix environment

```bash
NEXTAUTH_URL="https://domainhelix.contoso.local"
AUTH_SECRET="..."
ENTRA_TENANT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
ENTRA_CLIENT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
ENTRA_CLIENT_SECRET="***"
```

Restart DomainHelix. The login page enables **Entra ID (OIDC)**.

## 6. Enterprise Application assignment

1. Open the Enterprise Application corresponding to the app registration
2. **Properties** → Assignment required? → **Yes** (recommended)
3. **Users and groups** → assign only operators who should access DomainHelix

## Redirect URI checklist

| Environment | Redirect URI |
| --- | --- |
| Local dev | `http://localhost:3000/api/auth/callback/microsoft-entra-id` |
| Production | `https://<your-host>/api/auth/callback/microsoft-entra-id` |

`NEXTAUTH_URL` / `AUTH_URL` must match the public origin users hit (including HTTPS).

## Least privilege

- Prefer single-tenant app
- Prefer assignment-required
- Avoid Directory.ReadWrite.* scopes
- Use breakglass only when Entra is unavailable

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Entra option disabled | Missing `ENTRA_TENANT_ID` / `ENTRA_CLIENT_ID` / secret |
| `redirect_uri_mismatch` | Exact match including scheme/host/path |
| Consent error | Admin consent for Graph permissions |
| User blocked | Enterprise App assignment |
