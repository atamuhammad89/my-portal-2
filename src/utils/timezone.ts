/**
 * Convert ISO timestamp to user's local timezone
 * @param isoDate - ISO format date string or timestamp
 * @param options - Formatting options
 * @returns Formatted date string in user's timezone
 */
export function formatToUserTimezone(
  isoDate: string | number | null | undefined,
  options: {
    locale?: string;
    dateStyle?: "short" | "medium" | "long";
    timeStyle?: "short" | "medium" | "long";
  } = {}
): string {
  if (!isoDate) return "—";

  const {
    locale = typeof navigator !== "undefined" ? navigator.language : "en-US",
    dateStyle = "medium",
    timeStyle = "short",
  } = options;

  try {
    const date = typeof isoDate === "number" ? new Date(isoDate) : new Date(String(isoDate));

    if (isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat(locale, {
      dateStyle,
      timeStyle,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, // User's system timezone
    }).format(date);
  } catch {
    return "—";
  }
}

/**
 * Get user's timezone identifier
 */
export function getUserTimezoneOffset(): string {
  if (typeof Intl === "undefined") return "UTC";
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Format duration (no timezone needed)
 */
export function formatDuration(durationSeconds: number): string {
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

/**
 * Parse various date formats and convert to user timezone
 */
export function parseDateSafe(raw: string | number | null | undefined): string {
  if (!raw) return "—";

  let date: Date;
  const ts = Number(raw);

  if (!isNaN(ts) && ts > 0) {
    // Detect seconds vs milliseconds:
    // Unix timestamps in seconds are ~10 digits (< 1e11 until year 5138)
    // Millisecond timestamps are ~13 digits (> 1e11)
    date = ts < 1e11 ? new Date(ts * 1000) : new Date(ts);
  } else if (typeof raw === "string" && raw.includes("/")) {
    // Handle DD/MM/YYYY format
    const [datePart, timePart] = raw.split(",").map(s => s.trim());
    const [day, month, year] = datePart.split("/");
    const iso = `${year}-${month}-${day}T${timePart || "00:00:00"}`;
    date = new Date(iso);
  } else {
    // Try ISO format
    date = new Date(String(raw));
  }

  if (isNaN(date.getTime())) return "—";

  return formatToUserTimezone(date.getTime(), {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * Get the raw ISO date (for debugging/testing)
 */
export function getRawISODate(isoDate: string | number | null | undefined): string {
  if (!isoDate) return "—";
  try {
    const date = typeof isoDate === "number" ? new Date(isoDate) : new Date(String(isoDate));
    if (isNaN(date.getTime())) return "—";
    return date.toISOString();
  } catch {
    return "—";
  }
}
