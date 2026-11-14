import { NextResponse } from "next/server";
import {
  issueSamlBridgeToken,
  parseRelayStateProvider,
  validateSamlResponse,
} from "@/lib/auth/saml";
import { appBaseUrl } from "@/lib/auth/config";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const samlResponse = String(form.get("SAMLResponse") || "");
    const relayState = form.get("RelayState") ? String(form.get("RelayState")) : null;
    const provider = parseRelayStateProvider(relayState);

    if (!samlResponse) {
      return NextResponse.redirect(new URL("/login?error=Missing%20SAMLResponse", appBaseUrl()));
    }

    const profile = await validateSamlResponse(samlResponse, provider);
    const token = await issueSamlBridgeToken(profile);
    const dest = new URL("/login", appBaseUrl());
    dest.searchParams.set("samlToken", token);
    return NextResponse.redirect(dest);
  } catch (err) {
    const message = err instanceof Error ? err.message : "SAML validation failed";
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(message)}`, appBaseUrl())
    );
  }
}
