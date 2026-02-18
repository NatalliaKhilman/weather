import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const base =
    process.env.NEXTAUTH_URL ||
    (request.headers.get("x-forwarded-proto") || "http") +
      "://" +
      (request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost:3000");
  const url = base.replace(/\/$/, "") + "/api/auth/callback/google";
  return Response.json({ callbackUrl: url });
}
