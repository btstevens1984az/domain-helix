"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Cloud,
  KeyRound,
  Lock,
  Network,
  ShieldCheck,
} from "lucide-react";
import { HelixLogo } from "@/components/shared/helix-logo";
import type { SamlProviderId } from "@/types";

type Method = "breakglass" | "active-directory" | "entra" | "saml";

type Capabilities = {
  breakglass: boolean;
  activeDirectory: boolean;
  entraOidc: boolean;
  saml: boolean;
  breakglassHint?: string;
  samlProviders: Record<SamlProviderId, boolean>;
};

const methods: {
  id: Method;
  label: string;
  description: string;
  icon: typeof Lock;
}[] = [
  {
    id: "breakglass",
    label: "Breakglass local",
    description: "Emergency local admin",
    icon: KeyRound,
  },
  {
    id: "active-directory",
    label: "Active Directory",
    description: "On-prem LDAP bind",
    icon: Building2,
  },
  {
    id: "entra",
    label: "Entra ID (OIDC)",
    description: "Azure tenant login",
    icon: Cloud,
  },
  {
    id: "saml",
    label: "SAML SSO",
    description: "Cloud / enterprise IdP",
    icon: Network,
  },
];

const samlLabels: Record<SamlProviderId, string> = {
  "entra-saml": "Entra ID SAML",
  okta: "Okta",
  ping: "PingFederate / PingOne",
  onelogin: "OneLogin",
  google: "Google Workspace",
  generic: "Generic SAML 2.0",
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [method, setMethod] = useState<Method>("breakglass");
  const [caps, setCaps] = useState<Capabilities | null>(null);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [samlProvider, setSamlProvider] = useState<SamlProviderId>("generic");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const callbackUrl = searchParams.get("callbackUrl") || "/graph";
  const urlError = searchParams.get("error");

  useEffect(() => {
    fetch("/api/auth/capabilities")
      .then((r) => r.json())
      .then((d) => {
        setCaps(d);
        if (d.breakglassHint) setEmail(d.breakglassHint);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (urlError) setError(urlError);
  }, [urlError]);

  useEffect(() => {
    const samlToken = searchParams.get("samlToken");
    if (!samlToken) return;
    setLoading(true);
    signIn("saml", { token: samlToken, redirect: false }).then((res) => {
      if (res?.error) {
        setError(res.error);
        setLoading(false);
        return;
      }
      router.replace(callbackUrl);
    });
  }, [searchParams, callbackUrl, router]);

  const subtitle = useMemo(() => {
    switch (method) {
      case "breakglass":
        return "Use the seeded local breakglass account only for emergency access.";
      case "active-directory":
        return "Authenticate against your on-prem Active Directory via LDAP/LDAPS.";
      case "entra":
        return "Sign in with your Azure tenant through Entra ID OpenID Connect.";
      case "saml":
        return "Federate with Entra SAML, Okta, Ping, OneLogin, Google, or any SAML 2.0 IdP.";
    }
  }, [method]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (method === "breakglass") {
        const res = await signIn("breakglass", {
          email,
          password,
          redirect: false,
        });
        if (res?.error) throw new Error("Invalid breakglass credentials");
        router.replace(callbackUrl);
        return;
      }

      if (method === "active-directory") {
        const res = await signIn("active-directory", {
          username,
          password,
          redirect: false,
        });
        if (res?.error) throw new Error("Active Directory authentication failed");
        router.replace(callbackUrl);
        return;
      }

      if (method === "entra") {
        await signIn("microsoft-entra-id", { callbackUrl });
        return;
      }

      if (method === "saml") {
        window.location.href = `/api/auth/saml/login?provider=${samlProvider}`;
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 20% 10%, rgba(31,168,160,0.18), transparent 45%), radial-gradient(ellipse at 80% 90%, rgba(62,207,207,0.12), transparent 40%), linear-gradient(160deg, #070b10 0%, #0c141c 50%, #081018 100%)",
        }}
      />
      <div className="helix-grid pointer-events-none absolute inset-0 opacity-40" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-[920px]"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <HelixLogo className="mb-4 h-14 w-14" />
          <h1
            className="text-3xl font-semibold tracking-tight text-[var(--text-primary)] md:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            DomainHelix
          </h1>
          <p className="mt-2 max-w-md text-sm text-[var(--text-secondary)]">
            Secure access to your hybrid identity digital twin. Choose how you authenticate.
          </p>
        </div>

        <div className="glass-strong grid overflow-hidden rounded-[24px] border border-[var(--border-subtle)] md:grid-cols-[280px_1fr]">
          <aside className="border-b border-[var(--border-subtle)] bg-black/20 p-4 md:border-b-0 md:border-r">
            <div className="mb-3 flex items-center gap-2 px-2 text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
              <ShieldCheck className="h-3.5 w-3.5 text-[var(--accent-teal)]" />
              Sign-in methods
            </div>
            <div className="space-y-1">
              {methods.map((m) => {
                const Icon = m.icon;
                const active = method === m.id;
                const disabled =
                  (m.id === "active-directory" && caps && !caps.activeDirectory) ||
                  (m.id === "entra" && caps && !caps.entraOidc) ||
                  (m.id === "saml" && caps && !caps.saml);
                return (
                  <button
                    key={m.id}
                    type="button"
                    disabled={Boolean(disabled)}
                    onClick={() => setMethod(m.id)}
                    className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-all ${
                      active
                        ? "bg-[color-mix(in_srgb,var(--accent-cyan)_12%,transparent)] text-[var(--accent-cyan)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--accent-cyan)_28%,transparent)]"
                        : "text-[var(--text-secondary)] hover:bg-white/4 hover:text-[var(--text-primary)]"
                    } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      <span className="block text-[13px] font-medium">{m.label}</span>
                      <span className="mt-0.5 block text-[11px] text-[var(--text-muted)]">
                        {disabled ? "Configure env to enable" : m.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="p-6 md:p-8">
            <div className="mb-6">
              <h2
                className="text-xl font-semibold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {methods.find((m) => m.id === method)?.label}
              </h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{subtitle}</p>
            </div>

            <AnimatePresence mode="wait">
              <motion.form
                key={method}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                onSubmit={onSubmit}
                className="space-y-4"
              >
                {method === "breakglass" && (
                  <>
                    <Field
                      label="Breakglass username / email"
                      value={email}
                      onChange={setEmail}
                      autoComplete="username"
                    />
                    <Field
                      label="Password"
                      type="password"
                      value={password}
                      onChange={setPassword}
                      autoComplete="current-password"
                    />
                  </>
                )}

                {method === "active-directory" && (
                  <>
                    <Field
                      label="AD username (sAMAccountName or UPN)"
                      value={username}
                      onChange={setUsername}
                      autoComplete="username"
                    />
                    <Field
                      label="Password"
                      type="password"
                      value={password}
                      onChange={setPassword}
                      autoComplete="current-password"
                    />
                  </>
                )}

                {method === "entra" && (
                  <p className="rounded-xl border border-[var(--border-subtle)] bg-black/20 px-4 py-3 text-sm text-[var(--text-secondary)]">
                    You will be redirected to Microsoft Entra ID for your tenant. DomainHelix must be
                    registered as an Enterprise Application — see{" "}
                    <code className="text-[var(--accent-cyan)]">docs/entra-enterprise-app.md</code>.
                  </p>
                )}

                {method === "saml" && (
                  <div>
                    <label className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                      Identity provider
                    </label>
                    <select
                      value={samlProvider}
                      onChange={(e) => setSamlProvider(e.target.value as SamlProviderId)}
                      className="w-full rounded-xl border border-[var(--border-subtle)] bg-[#0a1016] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[color-mix(in_srgb,var(--accent-cyan)_45%,transparent)]"
                    >
                      {(Object.keys(samlLabels) as SamlProviderId[]).map((id) => (
                        <option key={id} value={id}>
                          {samlLabels[id]}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs text-[var(--text-muted)]">
                      ACS URL and SP Entity ID are published in{" "}
                      <code className="text-[var(--accent-cyan)]">docs/saml-sso.md</code>.
                    </p>
                  </div>
                )}

                {error ? (
                  <div className="rounded-xl border border-[color-mix(in_srgb,var(--signal-critical)_35%,transparent)] bg-[color-mix(in_srgb,var(--signal-critical)_10%,transparent)] px-3 py-2 text-sm text-[var(--signal-critical)]">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,var(--accent-teal),var(--accent-cyan))] px-4 py-3 text-sm font-semibold text-[#041016] transition hover:brightness-110 disabled:opacity-60"
                >
                  <Lock className="h-4 w-4" />
                  {loading
                    ? "Signing in…"
                    : method === "entra" || method === "saml"
                      ? "Continue"
                      : "Sign in"}
                </button>
              </motion.form>
            </AnimatePresence>

            <p className="mt-6 text-[11px] leading-relaxed text-[var(--text-muted)]">
              Sessions use httpOnly cookies (Secure in production, SameSite=Lax). Rotate breakglass
              credentials after first deploy. Least-privilege guidance:{" "}
              <code className="text-[var(--text-secondary)]">docs/authentication.md</code>.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
        {label}
      </label>
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        required={type !== undefined}
        className="w-full rounded-xl border border-[var(--border-subtle)] bg-[#0a1016] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[color-mix(in_srgb,var(--accent-cyan)_45%,transparent)]"
      />
    </div>
  );
}
