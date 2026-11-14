import { NextResponse } from "next/server";
import { spMetadataXml } from "@/lib/auth/saml";

export const dynamic = "force-dynamic";

export async function GET() {
  return new NextResponse(spMetadataXml(), {
    headers: {
      "Content-Type": "application/samlmetadata+xml; charset=utf-8",
      "Content-Disposition": 'inline; filename="domainhelix-sp-metadata.xml"',
    },
  });
}
