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
  try {
    let token: string | null = null;

    // 1. Try Authorization header first
    const authHeader = req.headers.get("authorization") ?? "";

    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }

    // 2. Fall back to HttpOnly cookie "token" (standard cookie transport)
    if (!token) {
      token = req.cookies.get("token")?.value ?? null;
    }

    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);

    return payload as unknown as JwtPayload;
  } catch (err) {
    console.error("JWT VERIFY ERROR:", err);
    return null;
  }
}

export function requireRole(
  payload: JwtPayload | null,
  roles: string[]
): boolean {
  if (!payload) return false;

  return roles.includes(payload.role);
}