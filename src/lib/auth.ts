import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  provider: string;
};

/**
 * Local credential check used by the demo admin bootstrap.
 * Entra / OIDC is enabled when AUTH_PROVIDER=entra and ENTRA_* vars are set.
 */
export async function verifyLocalCredentials(
  email: string,
  password: string
): Promise<SessionUser | null> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    provider: user.provider,
  };
}

export function entraConfigured() {
  return Boolean(
    process.env.ENTRA_TENANT_ID &&
      process.env.ENTRA_CLIENT_ID &&
      process.env.ENTRA_CLIENT_SECRET
  );
}

export function authMode() {
  if (process.env.AUTH_PROVIDER === "entra" && entraConfigured()) return "entra";
  return "local";
}

export function oidcDiscoveryUrl() {
  const tenant = process.env.ENTRA_TENANT_ID;
  if (!tenant) return null;
  return `https://login.microsoftonline.com/${tenant}/v2.0/.well-known/openid-configuration`;
}
