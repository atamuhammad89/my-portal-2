import { jwtVerify } from "jose";
import { NextRequest } from "next/server";

const secretKey = process.env.AUTH_JWT_SECRET || "default_dev_secret_key_at_least_32_characters_long";
export const JWT_SECRET = new TextEncoder().encode(secretKey);

export type JwtPayload = {
  sub: string;
  email: string;
  role: string;
  tenantId: string | null;
};

export async function verifyRequestJwt(
  req: NextRequest
): Promise<JwtPayload | null> {
  const candidates: string[] = [];

  // 1. Authorization header token
  const authHeader = req.headers.get("authorization") ?? "";
  if (authHeader.startsWith("Bearer ")) {
    const bearer = authHeader.slice(7).trim();
    if (bearer) candidates.push(bearer);
  }

  // 2. Cookie tokens (prioritizing HttpOnly "token")
  const configuredName = process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME || "voiceos_auth_token";
  const cookieNames = ["token", configuredName, "voiceos_auth_token", "access_token"];
  for (const name of cookieNames) {
    const val = req.cookies.get(name)?.value;
    if (val && val !== "1" && !candidates.includes(val)) {
      candidates.push(val);
    }
  }

  // Try each candidate token until one successfully verifies
  for (const token of candidates) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload) {
        return payload as unknown as JwtPayload;
      }
    } catch {
      // Candidate token failed verification, try next candidate
    }
  }

  return null;
}

export function requireRole(
  payload: JwtPayload | null,
  roles: string[]
): boolean {
  if (!payload) return false;

  return roles.includes(payload.role);
}