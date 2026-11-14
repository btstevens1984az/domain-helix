import { NextResponse } from "next/server";
import type { SamlProviderId } from "@/types";
import { getSamlLoginUrl } from "@/lib/auth/saml";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provider = (searchParams.get("provider") || "generic") as SamlProviderId;
  try {
    const url = await getSamlLoginUrl(provider);
    return NextResponse.redirect(url);
  } catch (err) {
    const message = err instanceof Error ? err.message : "SAML not configured";
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(message)}`, request.url)
    );
  }
}
