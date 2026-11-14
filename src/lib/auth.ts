/** Re-export auth helpers for legacy imports */
export { auth, signIn, signOut } from "@/auth";
export {
  getAuthCapabilities,
  entraOidcConfigured as entraConfigured,
  ldapConfigured,
  breakglassConfigured,
  authSecret,
  appBaseUrl,
} from "@/lib/auth/config";

export function authMode() {
  if (process.env.AUTH_PROVIDER === "entra") return "entra";
  if (process.env.AUTH_PROVIDER === "saml") return "saml";
  if (process.env.AUTH_PROVIDER === "active-directory") return "active-directory";
  return "multi";
}
