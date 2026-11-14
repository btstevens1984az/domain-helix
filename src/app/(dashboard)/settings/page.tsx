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
        subtitle="Authentication, roles, and connector configuration guidance"
        role={role}
        onRoleChange={setRole}
      />

      <div className="scrollbar-thin flex-1 overflow-y-auto p-4 md:p-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader
              title="Authentication"
              description="Local admin plus Entra ID / OIDC support"
              action={<Badge variant="cyan">local + OIDC</Badge>}
            />
            <div className="space-y-3 text-xs leading-relaxed text-[var(--text-secondary)]">
              <p>
                Demo credentials: <code className="text-[var(--accent-cyan)]">admin@domainhelix.local</code> /{" "}
                <code className="text-[var(--accent-cyan)]">DomainHelix!Admin</code>
              </p>
              <p>
                Configure Entra by setting <code>ENTRA_TENANT_ID</code>, <code>ENTRA_CLIENT_ID</code>,{" "}
                <code>ENTRA_CLIENT_SECRET</code>, and <code>AUTH_PROVIDER=entra</code>.
              </p>
              <p>
                Role views (Identity / Security / Infra) reshape the fabric graph and emphasize
                relevant signals without changing underlying data access in demo mode.
              </p>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Least privilege"
              description="Guidance for production connector accounts"
            />
            <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
              <li>• AD: read-only LDAP bind; replication metadata; certificate template read</li>
              <li>• Entra: Directory.Read.All, Policy.Read.All, PrivilegedAccess.Read.AzureAD</li>
              <li>• CrowdStrike: detections read scope only unless containment playbooks enabled</li>
              <li>• Dynatrace: metrics.read / traces for auth services</li>
              <li>• BigFix: operator with computer group scoped to Domain Controllers</li>
              <li>• vCenter: Read-only role on clusters hosting DCs</li>
            </ul>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader
              title="Environment"
              description="Copy .env.example and enable connectors gradually — mock mode fills gaps"
            />
            <pre className="overflow-x-auto rounded-xl border border-[var(--border-subtle)] bg-[#060a0e] p-4 text-[11px] text-[var(--accent-cyan)]">
{`DEMO_MODE=true
DATABASE_URL="file:./dev.db"
# AD_LDAP_URL=ldaps://dc.contoso.local
# ENTRA_TENANT_ID=...
# CROWDSTRIKE_CLIENT_ID=...
# DYNATRACE_URL=...
# BIGFIX_URL=...
# VCENTER_URL=...`}
            </pre>
          </Card>
        </div>
      </div>
    </div>
  );
}
