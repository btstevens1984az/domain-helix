import { SAML, ValidateInResponseTo } from "@node-saml/node-saml";
import { SignJWT, jwtVerify } from "jose";
import type { SamlProviderId } from "@/types";
import {
  appBaseUrl,
  authSecret,
  mapGroupsToRole,
  samlAcsUrl,
  samlEnvPrefix,
  samlSpEntityId,
} from "@/lib/auth/config";

export type SamlUserProfile = {
  email: string;
  name: string;
  groups: string[];
  role: string;
  provider: SamlProviderId;
};

function pickEnv(prefix: string, key: string, fallbackKeys: string[] = []) {
  const keys = [`${prefix}_${key}`, ...fallbackKeys];
  for (const k of keys) {
    const v = process.env[k];
    if (v && v.trim()) return v.trim();
  }
  return "";
}

export function resolveSamlSettings(provider: SamlProviderId = "generic") {
  const prefix = samlEnvPrefix(provider);
  const entryPoint =
    pickEnv(prefix, "SSO_URL", ["SAML_IDP_SSO_URL"]) ||
    pickEnv("SAML", "IDP_SSO_URL");
  const idpCert =
    pickEnv(prefix, "CERT", ["SAML_IDP_CERT"]) ||
    pickEnv("SAML", "IDP_CERT");
  const issuer = pickEnv(prefix, "ENTITY_ID", ["SAML_IDP_ENTITY_ID"]) || undefined;
  const idpMetadataUrl =
    pickEnv(prefix, "METADATA_URL", ["SAML_IDP_METADATA_URL"]) || undefined;

  return {
    callbackUrl: samlAcsUrl(),
    entryPoint: entryPoint || undefined,
    idpCert: idpCert || "PLACEHOLDER_CERT_REPLACE_IN_PRODUCTION",
    issuer: samlSpEntityId(),
    idpIssuer: issuer,
    identifierFormat:
      process.env.SAML_NAMEID_FORMAT ||
      "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
    wantAssertionsSigned: process.env.SAML_WANT_ASSERTIONS_SIGNED !== "false",
    wantAuthnResponseSigned: process.env.SAML_WANT_RESPONSE_SIGNED === "true",
    acceptedClockSkewMs: 5 * 60 * 1000,
    audience: samlSpEntityId(),
    validateInResponseTo: ValidateInResponseTo.never,
    // metadata URL is documented for operators; runtime uses SSO URL + cert when set
    idpMetadataUrl,
  };
}

export function createSamlClient(provider: SamlProviderId = "generic") {
  const settings = resolveSamlSettings(provider);
  if (!settings.entryPoint) {
    throw new Error(`SAML SSO URL is not configured for provider ${provider}`);
  }
  return new SAML({
    callbackUrl: settings.callbackUrl,
    entryPoint: settings.entryPoint,
    idpCert: settings.idpCert,
    issuer: settings.issuer,
    idpIssuer: settings.idpIssuer,
    identifierFormat: settings.identifierFormat,
    wantAssertionsSigned: settings.wantAssertionsSigned,
    wantAuthnResponseSigned: settings.wantAuthnResponseSigned,
    acceptedClockSkewMs: settings.acceptedClockSkewMs,
    audience: settings.audience,
    validateInResponseTo: settings.validateInResponseTo,
  });
}

export async function getSamlLoginUrl(provider: SamlProviderId = "generic") {
  const saml = createSamlClient(provider);
  const relayState = Buffer.from(JSON.stringify({ provider })).toString("base64url");
  return saml.getAuthorizeUrlAsync(relayState, undefined, {});
}

export async function validateSamlResponse(
  samlResponse: string,
  provider: SamlProviderId = "generic"
): Promise<SamlUserProfile> {
  const saml = createSamlClient(provider);
  const { profile } = await saml.validatePostResponseAsync({
    SAMLResponse: samlResponse,
  });

  if (!profile) throw new Error("SAML assertion missing profile");

  const email = String(
    profile.email ||
      profile.mail ||
      profile.nameID ||
      profile["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] ||
      ""
  ).toLowerCase();

  if (!email) throw new Error("SAML assertion missing email / NameID");

  const name = String(
    profile.displayName ||
      profile.cn ||
      `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim() ||
      profile["http://schemas.microsoft.com/identity/claims/displayname"] ||
      email
  );

  const groupsRaw =
    profile.groups ||
    profile.memberOf ||
    profile["http://schemas.microsoft.com/ws/2008/06/identity/claims/groups"] ||
    profile[process.env.SAML_GROUP_ATTRIBUTE || "groups"] ||
    [];

  const groups = (Array.isArray(groupsRaw) ? groupsRaw : [groupsRaw])
    .map((g) => String(g))
    .filter(Boolean);

  return {
    email,
    name,
    groups,
    role: mapGroupsToRole(groups),
    provider,
  };
}

export function spMetadataXml() {
  const entityId = samlSpEntityId();
  const acs = samlAcsUrl();
  return `<?xml version="1.0"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${entityId}">
  <SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol" AuthnRequestsSigned="false" WantAssertionsSigned="true">
    <NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</NameIDFormat>
    <AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${acs}" index="0" isDefault="true"/>
  </SPSSODescriptor>
  <Organization>
    <OrganizationName xml:lang="en">DomainHelix</OrganizationName>
    <OrganizationDisplayName xml:lang="en">DomainHelix</OrganizationDisplayName>
    <OrganizationURL xml:lang="en">${appBaseUrl()}</OrganizationURL>
  </Organization>
</EntityDescriptor>`;
}

/** Short-lived bridge token so ACS can complete Auth.js credentials sign-in */
export async function issueSamlBridgeToken(profile: SamlUserProfile) {
  const secret = new TextEncoder().encode(authSecret() || "dev-only-secret");
  return new SignJWT({ ...profile, purpose: "saml-bridge" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2m")
    .sign(secret);
}

export async function verifySamlBridgeToken(token: string): Promise<SamlUserProfile> {
  const secret = new TextEncoder().encode(authSecret() || "dev-only-secret");
  const { payload } = await jwtVerify(token, secret);
  if (payload.purpose !== "saml-bridge") throw new Error("Invalid SAML bridge token");
  return {
    email: String(payload.email),
    name: String(payload.name),
    groups: (payload.groups as string[]) || [],
    role: String(payload.role || "identity_engineer"),
    provider: (payload.provider as SamlProviderId) || "generic",
  };
}

export function parseRelayStateProvider(relayState?: string | null): SamlProviderId {
  if (!relayState) return "generic";
  try {
    const parsed = JSON.parse(Buffer.from(relayState, "base64url").toString("utf8"));
    return (parsed.provider as SamlProviderId) || "generic";
  } catch {
    return "generic";
  }
}
