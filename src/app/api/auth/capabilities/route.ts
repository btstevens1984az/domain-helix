import { NextResponse } from "next/server";
import { getAuthCapabilities, samlAcsUrl, samlSpEntityId } from "@/lib/auth/config";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ...getAuthCapabilities(),
    breakglassHint: process.env.BREAKGLASS_EMAIL || process.env.ADMIN_EMAIL || "breakglass@domainhelix.local",
    saml: {
      acsUrl: samlAcsUrl(),
      spEntityId: samlSpEntityId(),
      metadataUrl: `${samlSpEntityId().replace(/\/metadata$/, "")}/metadata`.includes("metadata")
        ? `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auth/saml/metadata`
        : `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auth/saml/metadata`,
    },
  });
}
