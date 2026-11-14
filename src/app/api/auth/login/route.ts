import { NextResponse } from "next/server";
import { authMode, entraConfigured, oidcDiscoveryUrl, verifyLocalCredentials } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    mode: authMode(),
    entraConfigured: entraConfigured(),
    oidcDiscoveryUrl: oidcDiscoveryUrl(),
    demoEmail: process.env.ADMIN_EMAIL ?? "admin@domainhelix.local",
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  if (authMode() === "entra") {
    return NextResponse.json(
      {
        error: "AUTH_PROVIDER=entra — redirect users through Entra OIDC (configure NextAuth/OIDC client).",
        oidcDiscoveryUrl: oidcDiscoveryUrl(),
      },
      { status: 501 }
    );
  }

  const user = await verifyLocalCredentials(body.email ?? "", body.password ?? "");
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  return NextResponse.json({
    user,
    message: "Authenticated (demo session — wire cookies/JWT for production hardening).",
  });
}
