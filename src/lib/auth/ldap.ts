import { Client } from "ldapts";
import { mapGroupsToRole } from "@/lib/auth/config";

export type LdapAuthResult = {
  email: string;
  name: string;
  groups: string[];
  role: string;
};

/**
 * Authenticate against on-prem Active Directory via LDAP/LDAPS.
 * Uses service bind + user search, then user bind for password verification.
 */
export async function authenticateAgainstAd(
  username: string,
  password: string
): Promise<LdapAuthResult | null> {
  const url = process.env.AD_LDAP_URL;
  const baseDn = process.env.AD_BASE_DN;
  if (!url || !baseDn || !username || !password) return null;

  const bindDn = process.env.AD_BIND_DN || process.env.AD_LDAP_BIND_DN || "";
  const bindPassword = process.env.AD_BIND_PASSWORD || process.env.AD_LDAP_BIND_PASSWORD || "";
  const userFilterTemplate =
    process.env.AD_USER_FILTER ||
    "(|(sAMAccountName={{username}})(userPrincipalName={{username}})(mail={{username}}))";
  const groupAttr = process.env.AD_GROUP_ATTRIBUTE || "memberOf";

  const client = new Client({
    url,
    timeout: 10_000,
    connectTimeout: 10_000,
    tlsOptions: process.env.AD_LDAP_TLS_INSECURE === "true" ? { rejectUnauthorized: false } : undefined,
  });

  try {
    if (bindDn) {
      await client.bind(bindDn, bindPassword);
    }

    const filter = userFilterTemplate.replaceAll("{{username}}", escapeLdap(username));
    const { searchEntries } = await client.search(baseDn, {
      scope: "sub",
      filter,
      attributes: ["dn", "cn", "displayName", "mail", "userPrincipalName", "sAMAccountName", groupAttr],
      sizeLimit: 1,
    });

    const entry = searchEntries[0];
    if (!entry?.dn) return null;

    // Verify credentials with user bind
    const userClient = new Client({
      url,
      timeout: 10_000,
      connectTimeout: 10_000,
      tlsOptions: process.env.AD_LDAP_TLS_INSECURE === "true" ? { rejectUnauthorized: false } : undefined,
    });
    try {
      await userClient.bind(String(entry.dn), password);
    } catch {
      return null;
    } finally {
      await userClient.unbind().catch(() => undefined);
    }

    const groupsRaw = entry[groupAttr];
    const groups = normalizeGroups(groupsRaw);
    const email =
      String(entry.mail || entry.userPrincipalName || `${username}@ad.local`).toLowerCase();
    const name = String(entry.displayName || entry.cn || username);

    return {
      email,
      name,
      groups,
      role: mapGroupsToRole(groups),
    };
  } catch (err) {
    console.error("LDAP authentication failed:", err);
    return null;
  } finally {
    await client.unbind().catch(() => undefined);
  }
}

function escapeLdap(value: string) {
  return value.replace(/[\\*()+\x00]/g, (c) => `\\${c.charCodeAt(0).toString(16).padStart(2, "0")}`);
}

function normalizeGroups(raw: unknown): string[] {
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return list
    .map((g) => String(g))
    .map((dn) => {
      const cn = dn.match(/^CN=([^,]+)/i);
      return cn ? cn[1] : dn;
    })
    .filter(Boolean);
}
