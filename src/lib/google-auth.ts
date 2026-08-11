/**
 * Client-side Google Authentication helper for CallAutomate / VoiceOS portal.
 */

export interface GoogleUserPayload {
  email: string;
  full_name: string;
  google_id?: string;
  avatar_url?: string;
}

export async function authenticateWithGoogle(payload: GoogleUserPayload) {
  const response = await fetch("/api/auth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || "Google Authentication failed.");
  }

  return data;
}
