/**
 * Date utilities for AstraDB compatibility
 * AstraDB works better with ISO string dates rather than Date objects
 */

export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

export function formatDateForDisplay(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
}

export function isValidDateString(dateString: string): boolean {
  try {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
}
