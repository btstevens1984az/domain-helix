"use client";

import { Topbar } from "@/components/layout/topbar";
import { useRole } from "@/components/layout/role-context";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";

export default function SettingsPage() {
  const { role, setRole } = useRole();

  return (
    <div className="flex h-full flex-col">
      <Topbar
        title="Settings"
        subtitle="Authentication methods, roles, and security guidance"
        role={role}
        onRoleChange={setRole}
      />

      <div className="scrollbar-thin flex-1 overflow-y-auto p-4 md:p-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader
              title="Authentication"
              description="Breakglass · Active Directory · Entra OIDC · SAML SSO"
              action={<Badge variant="cyan">multi-provider</Badge>}
            />
            <div className="space-y-3 text-xs leading-relaxed text-[var(--text-secondary)]">
              <p>
                Default breakglass account is seeded from{" "}
                <code className="text-[var(--accent-cyan)]">BREAKGLASS_EMAIL</code> /{" "}
                <code className="text-[var(--accent-cyan)]">BREAKGLASS_PASSWORD</code>. Rotate
                immediately after first deploy.
              </p>
              <p>
                Enable AD LDAP, Entra Enterprise App OIDC, or SAML IdPs via environment variables.
                Full runbooks live under <code className="text-[var(--accent-cyan)]">docs/</code>.
              </p>
              <p>
                Role views (Identity / Security / Infra) reshape the fabric graph emphasis without
                inventing extra privileges in demo mode.
              </p>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Least privilege"
              description="Guidance for production service accounts and IdP apps"
            />
            <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
              <li>• AD LDAP: read-only bind; directory search; optional group membership read</li>
              <li>• Entra OIDC: openid, profile, email; GroupMember.Read.All only if mapping roles</li>
              <li>• SAML: email + display name + groups claims; no write scopes on IdP</li>
              <li>• Breakglass: vault the password; disable interactive use outside emergencies</li>
              <li>• Playbooks that change state remain approval-gated by default</li>
            </ul>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader
              title="Environment"
              description="Copy .env.example — auth vars first, then optional telemetry integrations"
            />
            <pre className="overflow-x-auto rounded-xl border border-[var(--border-subtle)] bg-[#060a0e] p-4 text-[11px] text-[var(--accent-cyan)]">
{`AUTH_SECRET="generate-a-long-random-string"
NEXTAUTH_URL="https://domainhelix.contoso.local"
BREAKGLASS_EMAIL="breakglass@domainhelix.local"
BREAKGLASS_PASSWORD="ChangeMe-DomainHelix-Breakglass-2026!"
# AD_LDAP_URL=ldaps://dc.contoso.local:636
# ENTRA_TENANT_ID=...
# SAML_ENABLED=true`}
            </pre>
          </Card>
        </div>
      </div>
    </div>
  );
}
