# Connecting DomainHelix to Active Directory

Use this when DomainHelix runs on a local server (Windows or Linux) that can reach your domain controllers over LDAP/LDAPS.

## Architecture

```
User → DomainHelix login (Active Directory)
     → Service bind (optional) + user search
     → User bind with submitted password
     → Group CN extraction → role mapping
     → Auth.js session cookie
```

Kerberos ticket login is not required; DomainHelix validates credentials with an LDAP user bind. LDAPS (port 636) is strongly recommended.

## Prerequisites

- Network path from the DomainHelix host to a DC (`389` LDAP or `636` LDAPS)
- A **read-only** service account for directory search (recommended)
- Base DN of your domain (e.g. `DC=contoso,DC=local`)
- Firewall allow for LDAP/LDAPS only from the DomainHelix host

## Environment variables

```bash
AD_LDAP_URL="ldaps://dc01.contoso.local:636"
AD_BASE_DN="DC=contoso,DC=local"
AD_BIND_DN="CN=DomainHelix LDAP,OU=Service Accounts,DC=contoso,DC=local"
AD_BIND_PASSWORD="***"
AD_USER_FILTER="(|(sAMAccountName={{username}})(userPrincipalName={{username}})(mail={{username}}))"
AD_GROUP_ATTRIBUTE=memberOf
AD_LDAP_TLS_INSECURE=false
```

| Variable | Purpose |
| --- | --- |
| `AD_LDAP_URL` | LDAP(S) URL of a DC or VIP |
| `AD_BASE_DN` | Search base |
| `AD_BIND_DN` / `AD_BIND_PASSWORD` | Service account used to locate the user DN |
| `AD_USER_FILTER` | Search filter; `{{username}}` is substituted and escaped |
| `AD_GROUP_ATTRIBUTE` | Usually `memberOf` |
| `AD_LDAP_TLS_INSECURE` | Lab-only — skips TLS cert verification |

## Service account permissions (least privilege)

Grant the bind account:

- **Read** on user objects in scope (or Domain Users)
- Ability to read `memberOf` / group membership
- No write, reset password, or replication rights

## User experience

1. Open DomainHelix → **Active Directory** on the login page.
2. Enter `sAMAccountName` (e.g. `jsmith`) or UPN (`jsmith@contoso.local`).
3. On success, DomainHelix creates/updates a local user mirror and issues a session.

## Role mapping

Group CNs from `memberOf` are matched against `AUTH_ADMIN_GROUPS`, `AUTH_SECURITY_GROUPS`, and `AUTH_INFRA_GROUPS` (see [authentication.md](./authentication.md)).

Example:

```bash
AUTH_ADMIN_GROUPS="DomainHelix-Admins"
AUTH_SECURITY_GROUPS="DomainHelix-Security"
AUTH_INFRA_GROUPS="DomainHelix-Infra"
```

Create those security groups in AD and nest operational teams accordingly.

## TLS notes

- Prefer a DC certificate trusted by the DomainHelix host trust store.
- For quick labs only: `AD_LDAP_TLS_INSECURE=true` (never production).

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Method disabled on login | `AD_LDAP_URL` and `AD_BASE_DN` (and bind DN) must be set |
| Invalid credentials | User locked / wrong password; try UPN form |
| TLS errors | Trust the DC cert or (lab) insecure flag |
| No role elevation | Confirm group CN names match `AUTH_*_GROUPS` |
