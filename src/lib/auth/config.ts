import type { SamlProviderId } from "@/types";

export function appBaseUrl() {
  return (
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ||
    process.env.AUTH_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

export function authSecret() {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
}

export function breakglassConfigured() {
  return Boolean(
    process.env.BREAKGLASS_EMAIL ||
      process.env.ADMIN_EMAIL ||
      process.env.BREAKGLASS_PASSWORD ||
      process.env.ADMIN_PASSWORD
  );
}

export function ldapConfigured() {
  return Boolean(
    process.env.AD_LDAP_URL &&
      process.env.AD_BASE_DN &&
      (process.env.AD_BIND_DN || process.env.AD_LDAP_BIND_DN)
  );
}

export function entraOidcConfigured() {
  return Boolean(
    process.env.ENTRA_TENANT_ID &&
      process.env.ENTRA_CLIENT_ID &&
      (process.env.ENTRA_CLIENT_SECRET || process.env.ENTRA_FEDERATED_CREDENTIAL === "true")
  );
}

export function samlConfigured(provider?: SamlProviderId) {
  if (provider) {
    const prefix = samlEnvPrefix(provider);
    return Boolean(
      process.env[`${prefix}_SSO_URL`] ||
        process.env[`${prefix}_METADATA_URL`] ||
        process.env.SAML_IDP_SSO_URL ||
        process.env.SAML_IDP_METADATA_URL
    );
  }
  return Boolean(
    process.env.SAML_ENABLED === "true" ||
      process.env.SAML_IDP_SSO_URL ||
      process.env.SAML_IDP_METADATA_URL ||
      process.env.SAML_ENTRA_SSO_URL ||
      process.env.SAML_OKTA_SSO_URL ||
      process.env.SAML_PING_SSO_URL ||
      process.env.SAML_ONELOGIN_SSO_URL ||
      process.env.SAML_GOOGLE_SSO_URL
  );
}

export function samlEnvPrefix(provider: SamlProviderId) {
  switch (provider) {
    case "entra-saml":
      return "SAML_ENTRA";
    case "okta":
      return "SAML_OKTA";
    case "ping":
      return "SAML_PING";
    case "onelogin":
      return "SAML_ONELOGIN";
    case "google":
      return "SAML_GOOGLE";
    default:
      return "SAML";
  }
}

export function samlSpEntityId() {
  return process.env.SAML_SP_ENTITY_ID || `${appBaseUrl()}/api/auth/saml/metadata`;
}

export function samlAcsUrl() {
  return process.env.SAML_ACS_URL || `${appBaseUrl()}/api/auth/saml/acs`;
}

export function getAuthCapabilities() {
  return {
    breakglass: true,
    activeDirectory: ldapConfigured(),
    entraOidc: entraOidcConfigured(),
    saml: samlConfigured(),
    samlProviders: {
      "entra-saml": samlConfigured("entra-saml") || samlConfigured(),
      okta: samlConfigured("okta") || samlConfigured(),
      ping: samlConfigured("ping") || samlConfigured(),
      onelogin: samlConfigured("onelogin") || samlConfigured(),
      google: samlConfigured("google") || samlConfigured(),
      generic: samlConfigured("generic") || samlConfigured(),
    } as Record<SamlProviderId, boolean>,
  };
}

export function mapGroupsToRole(groups: string[]): string {
  const normalized = groups.map((g) => g.toLowerCase());
  const adminGroups = (process.env.AUTH_ADMIN_GROUPS || "DomainHelix-Admins,Domain Admins")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const securityGroups = (process.env.AUTH_SECURITY_GROUPS || "DomainHelix-Security")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const infraGroups = (process.env.AUTH_INFRA_GROUPS || "DomainHelix-Infra")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (normalized.some((g) => adminGroups.includes(g))) return "admin";
  if (normalized.some((g) => securityGroups.includes(g))) return "security_analyst";
  if (normalized.some((g) => infraGroups.includes(g))) return "infrastructure_owner";
  return "identity_engineer";
}
