// Helper utilities for late check-in detection using a fixed timezone cutoff
// Rule: check-ins before or at 11:00 AM (Asia/Kolkata) are on-time; after 11:00 AM are late.

export const LATE_CUTOFF_TIMEZONE = "Asia/Kolkata";
export const LATE_CUTOFF_HOUR = 11;

/**
 * Convert a Date to an equivalent local time in the target timezone.
 * Returns a new Date constructed from the formatted parts to avoid
 * relying on the host machine's timezone offsets.
 */
function toTimeZoneDate(date, timeZone = LATE_CUTOFF_TIMEZONE) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const parts = formatter.formatToParts(date).reduce((acc, part) => {
    if (part.type !== "literal") {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});

  const isoLike = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
  return new Date(isoLike);
}

/**
 * Determine whether a check-in is late based on the 11:00 AM cutoff.
 * - On-time: before or exactly 11:00 AM
 * - Late: after 11:00 AM
 */
export function isLateCheckIn(checkInDate, timeZone = LATE_CUTOFF_TIMEZONE) {
  if (!checkInDate) return false;

  const checkInTime = new Date(checkInDate);
  if (Number.isNaN(checkInTime.getTime())) return false;

  const localCheckIn = toTimeZoneDate(checkInTime, timeZone);
  const cutoff = new Date(localCheckIn);
  cutoff.setHours(LATE_CUTOFF_HOUR, 0, 0, 0);

  return localCheckIn > cutoff;
}
