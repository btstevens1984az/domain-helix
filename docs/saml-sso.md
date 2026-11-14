# SAML 2.0 SSO

DomainHelix acts as a SAML 2.0 **Service Provider (SP)**. Configure any IdP with the endpoints below, then choose **SAML SSO** on the login page and pick your provider.

## SP endpoints (DomainHelix)

Assume `NEXTAUTH_URL=https://domainhelix.contoso.local`:

| Value | Default |
| --- | --- |
| **SP Entity ID** | `https://domainhelix.contoso.local/api/auth/saml/metadata` |
| **ACS URL** (HTTP-POST) | `https://domainhelix.contoso.local/api/auth/saml/acs` |
| **SP Metadata** | `GET https://domainhelix.contoso.local/api/auth/saml/metadata` |
| **Start login** | `GET /api/auth/saml/login?provider=<id>` |

Overrides:

```bash
SAML_SP_ENTITY_ID="https://domainhelix.contoso.local/api/auth/saml/metadata"
SAML_ACS_URL="https://domainhelix.contoso.local/api/auth/saml/acs"
SAML_ENABLED=true
```

## Attribute mapping

DomainHelix reads:

| Claim | Usage |
| --- | --- |
| NameID or `email` / `mail` | Primary user key (required) |
| `displayName` / `cn` / given+surname | Display name |
| `groups` / `memberOf` / Entra groups claim | Role mapping via `AUTH_*_GROUPS` |

Override group attribute:

```bash
SAML_GROUP_ATTRIBUTE=groups
```

## Provider IDs (login UI)

| Login selection | `provider` query | Env prefix |
| --- | --- | --- |
| Entra ID SAML | `entra-saml` | `SAML_ENTRA_*` |
| Okta | `okta` | `SAML_OKTA_*` |
| PingFederate / PingOne | `ping` | `SAML_PING_*` |
| OneLogin | `onelogin` | `SAML_ONELOGIN_*` |
| Google Workspace | `google` | `SAML_GOOGLE_*` |
| Generic SAML 2.0 | `generic` | `SAML_IDP_*` / `SAML_*` |

Each provider needs at least:

```bash
SAML_<PREFIX>_SSO_URL="https://idp.example.com/sso/saml"
SAML_<PREFIX>_CERT="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
# optional
SAML_<PREFIX>_ENTITY_ID="https://idp.example.com/metadata"
SAML_<PREFIX>_METADATA_URL="https://idp.example.com/metadata.xml"
```

---

## Entra ID SAML

1. Entra admin center → **Enterprise applications** → **New application** → **Create your own** (Non-gallery)
2. Name: `DomainHelix SAML`
3. **Single sign-on** → **SAML**
4. Basic SAML:
   - Identifier (Entity ID): SP Entity ID above
   - Reply URL (ACS): ACS URL above
5. Download **Certificate (Base64)** → `SAML_ENTRA_CERT`
6. Copy **Login URL** → `SAML_ENTRA_SSO_URL`
7. Copy Entra Identifier → `SAML_ENTRA_ENTITY_ID`
8. Attributes: ensure `emailaddress` or UPN is released; add groups claim if mapping roles
9. Assign users/groups to the Enterprise Application

```bash
SAML_ENABLED=true
SAML_ENTRA_SSO_URL="https://login.microsoftonline.com/<tenant-id>/saml2"
SAML_ENTRA_ENTITY_ID="https://sts.windows.net/<tenant-id>/"
SAML_ENTRA_CERT="MIID..."
```

---

## Okta SAML

1. Okta Admin → **Applications** → **Create App Integration** → **SAML 2.0**
2. Single sign-on URL: ACS URL
3. Audience URI (SP Entity ID): SP Entity ID
4. Name ID: EmailAddress
5. Attribute statements: `email`, `displayName`; Group attribute statements as needed
6. Copy IdP SSO URL + signing certificate

```bash
SAML_OKTA_SSO_URL="https://<org>.okta.com/app/<appId>/sso/saml"
SAML_OKTA_ENTITY_ID="http://www.okta.com/<appId>"
SAML_OKTA_CERT="MIID..."
SAML_OKTA_METADATA_URL="https://<org>.okta.com/app/<appId>/sso/saml/metadata"
```

---

## PingFederate / PingOne

1. Create an SP connection for DomainHelix
2. ACS: POST binding to ACS URL
3. Entity ID: SP Entity ID
4. Export IdP signing cert + SSO endpoint

```bash
SAML_PING_SSO_URL="https://sso.example.com/idp/SSO.saml2"
SAML_PING_ENTITY_ID="https://sso.example.com"
SAML_PING_CERT="MIID..."
```

---

## OneLogin

1. **Applications** → **Add App** → **SAML Custom Connector (Advanced)**
2. Audience: SP Entity ID
3. Recipient / ACS (Consumer) URL: ACS URL
4. SAML signature element: Assertion
5. Copy SAML 2.0 Endpoint + X.509 certificate

```bash
SAML_ONELOGIN_SSO_URL="https://<subdomain>.onelogin.com/trust/saml2/http-post/sso/<app-id>"
SAML_ONELOGIN_CERT="MIID..."
```

---

## Google Workspace SAML

1. Admin console → **Apps** → **Web and mobile apps** → **Add custom SAML app**
2. ACS URL + Entity ID from DomainHelix SP table
3. Name ID: Primary email
4. Download IdP certificate; copy SSO URL

```bash
SAML_GOOGLE_SSO_URL="https://accounts.google.com/o/saml2/idp?idpid=..."
SAML_GOOGLE_ENTITY_ID="https://accounts.google.com/o/saml2?idpid=..."
SAML_GOOGLE_CERT="MIID..."
```

---

## Generic SAML 2.0 IdP

Provide metadata URL **or** SSO URL + signing certificate + entity ID:

```bash
SAML_ENABLED=true
SAML_IDP_METADATA_URL="https://idp.example.com/metadata.xml"
# or explicit:
SAML_IDP_SSO_URL="https://idp.example.com/sso"
SAML_IDP_ENTITY_ID="https://idp.example.com"
SAML_IDP_CERT="MIID..."
```

## Runtime flow

1. User selects SAML provider on `/login`
2. Browser redirects to `/api/auth/saml/login?provider=...`
3. IdP authenticates and POSTs assertion to ACS
4. DomainHelix validates signature, issues a short-lived bridge token, completes Auth.js sign-in
5. User lands on **Identity Fabric** (`/graph`)

## Security notes

- Prefer signed assertions (`SAML_WANT_ASSERTIONS_SIGNED=true`)
- Keep IdP certificates rotated; update env when rotating
- Restrict Enterprise App / IdP assignment to DomainHelix operators
- Breakglass remains available if the IdP is down
