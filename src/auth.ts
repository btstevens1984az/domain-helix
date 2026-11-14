import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import type { Provider } from "next-auth/providers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authenticateAgainstAd } from "@/lib/auth/ldap";
import { verifySamlBridgeToken } from "@/lib/auth/saml";
import { upsertFederatedUser } from "@/lib/auth/users";
import {
  authSecret,
  entraOidcConfigured,
  ldapConfigured,
  mapGroupsToRole,
} from "@/lib/auth/config";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      provider: string;
    };
  }

  interface User {
    role?: string;
    provider?: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    provider?: string;
  }
}

const providers: Provider[] = [
  Credentials({
    id: "breakglass",
    name: "Breakglass",
    credentials: {
      email: { label: "Username", type: "text" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email = String(credentials?.email ?? "").toLowerCase().trim();
      const password = String(credentials?.password ?? "");
      if (!email || !password) return null;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user?.passwordHash) return null;
      if (user.provider !== "local" && user.role !== "admin") return null;

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return null;

      await prisma.auditLog.create({
        data: {
          actor: user.email,
          action: "login.breakglass",
          resource: "auth",
          details: "Local breakglass authentication succeeded",
        },
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        provider: "local",
      };
    },
  }),
  Credentials({
    id: "active-directory",
    name: "Active Directory",
    credentials: {
      username: { label: "Username", type: "text" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!ldapConfigured()) return null;
      const username = String(credentials?.username ?? "").trim();
      const password = String(credentials?.password ?? "");
      if (!username || !password) return null;

      const profile = await authenticateAgainstAd(username, password);
      if (!profile) return null;

      const user = await upsertFederatedUser({
        email: profile.email,
        name: profile.name,
        role: profile.role,
        provider: "active-directory",
        groups: profile.groups,
      });

      await prisma.auditLog.create({
        data: {
          actor: user.email,
          action: "login.active-directory",
          resource: "auth",
          details: `Groups: ${profile.groups.slice(0, 8).join(", ")}`,
        },
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        provider: "active-directory",
      };
    },
  }),
  Credentials({
    id: "saml",
    name: "SAML",
    credentials: {
      token: { label: "Token", type: "text" },
    },
    async authorize(credentials) {
      const token = String(credentials?.token ?? "");
      if (!token) return null;
      const profile = await verifySamlBridgeToken(token);
      const user = await upsertFederatedUser({
        email: profile.email,
        name: profile.name,
        role: profile.role,
        provider: `saml:${profile.provider}`,
        groups: profile.groups,
      });

      await prisma.auditLog.create({
        data: {
          actor: user.email,
          action: "login.saml",
          resource: "auth",
          details: `Provider ${profile.provider}`,
        },
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        provider: `saml:${profile.provider}`,
      };
    },
  }),
];

if (entraOidcConfigured()) {
  providers.push(
    MicrosoftEntraID({
      clientId: process.env.ENTRA_CLIENT_ID!,
      clientSecret: process.env.ENTRA_CLIENT_SECRET || "federated",
      issuer: `https://login.microsoftonline.com/${process.env.ENTRA_TENANT_ID}/v2.0`,
      authorization: {
        params: {
          scope: "openid profile email User.Read GroupMember.Read.All",
        },
      },
    })
  );
}

const authUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || "";
const secureCookies = /^https:\/\//i.test(authUrl);

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: authSecret() || undefined,
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8, // 8 hours
  },
  cookies: {
    sessionToken: {
      // Only use __Secure- + Secure flag when AUTH/NEXTAUTH URL is HTTPS.
      // Docker/local demos run on http://localhost and must keep sessions.
      name: secureCookies
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: secureCookies,
      },
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers,
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || "identity_engineer";
        token.provider = user.provider || account?.provider || "local";
      }

      if (account?.provider === "microsoft-entra-id" && profile) {
        const email = String(
          (profile as { preferred_username?: string; email?: string }).email ||
            (profile as { preferred_username?: string }).preferred_username ||
            token.email ||
            ""
        ).toLowerCase();
        const name = String(profile.name || email);
        const groups = Array.isArray((profile as { groups?: string[] }).groups)
          ? ((profile as { groups?: string[] }).groups as string[])
          : [];
        const role = mapGroupsToRole(groups);
        if (email) {
          const dbUser = await upsertFederatedUser({
            email,
            name,
            role,
            provider: "entra",
            groups,
          });
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.provider = "entra";
          token.email = dbUser.email;
          token.name = dbUser.name;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id || "");
        session.user.role = String(token.role || "identity_engineer");
        session.user.provider = String(token.provider || "local");
        session.user.email = String(token.email || session.user.email || "");
        session.user.name = String(token.name || session.user.name || "");
      }
      return session;
    },
  },
});
