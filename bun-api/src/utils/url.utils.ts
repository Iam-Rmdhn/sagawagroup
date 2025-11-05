// Utility functions for handling dynamic URLs

/**
 * Get the base URL for the application based on environment
 * @returns The base URL (e.g., http://localhost:3000 or https://www.sagawagroup.id)
 */
export function getBaseUrl(request?: Request): string {
  // Prefer a configured BASE_URL when it points to a non-local domain
  const normalizedBaseFromEnv = normalizeBaseUrl(process.env.BASE_URL);
  if (normalizedBaseFromEnv && !isLocalHost(normalizedBaseFromEnv)) {
    return normalizedBaseFromEnv;
  }

  if (request) {
    const resolvedFromRequest = resolveBaseUrlFromRequest(request, false);
    if (resolvedFromRequest) {
      return resolvedFromRequest;
    }
  }

  // Default based on NODE_ENV when no request context is provided
  if (typeof process !== "undefined" && process.env) {
    if (process.env.NODE_ENV === "production") {
      return "https://www.sagawagroup.id";
    }

    const port = process.env.PORT || "3000";
    return `http://localhost:${port}`;
  }

  return "http://localhost:3000";
}

function normalizeBaseUrl(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\/$/, "");
}

function isLocalHost(url: string): boolean {
  const withoutScheme = url.replace(/^https?:\/\//i, "");
  const host = withoutScheme.split("/")[0];
  if (!host) return true;

  if (
    host.startsWith("localhost") ||
    host.startsWith("127.") ||
    host.startsWith("0.0.0.0") ||
    host.startsWith("192.168.") ||
    host.startsWith("10.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  ) {
    return true;
  }

  return false;
}

export function resolveBaseUrlFromRequest(
  request: Request,
  preferNonLocal: boolean = true
): string {
  const candidates: Array<string> = [];

  const envBase = normalizeBaseUrl(process.env.BASE_URL);
  if (envBase) candidates.push(envBase);

  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) {
    const forwardedProto =
      request.headers.get("x-forwarded-proto") ||
      (forwardedHost.includes("localhost") ? "http" : "https");
    const forwardedBase = normalizeBaseUrl(
      `${forwardedProto}://${forwardedHost}`
    );
    if (forwardedBase) candidates.push(forwardedBase);
  }

  const originHeader = normalizeBaseUrl(request.headers.get("origin"));
  if (originHeader) candidates.push(originHeader);

  const hostHeader = request.headers.get("host");
  if (hostHeader) {
    const hostProto =
      request.headers.get("x-forwarded-proto") ||
      (request.url.startsWith("https://") ? "https" : "http");
    const hostBase = normalizeBaseUrl(`${hostProto}://${hostHeader}`);
    if (hostBase) candidates.push(hostBase);
  }

  try {
    const requestUrl = new URL(request.url);
    const urlBase = normalizeBaseUrl(requestUrl.origin);
    if (urlBase) candidates.push(urlBase);
  } catch (error) {
    // Ignore parsing errors and continue with other candidates
  }

  const port = process.env.PORT || "3000";
  candidates.push(`http://localhost:${port}`);

  const uniqueCandidates = candidates.filter((candidate, index) => {
    if (!candidate) return false;
    return candidates.indexOf(candidate) === index;
  });

  if (preferNonLocal) {
    const nonLocal = uniqueCandidates.find(
      (candidate) => !isLocalHost(candidate)
    );
    if (nonLocal) return nonLocal;
  }

  return uniqueCandidates[0] || `http://localhost:${port}`;
}

/**
 * Check if a URL is a local uploads URL
 * @param url The URL to check
 * @returns True if the URL is a local uploads URL
 */
export function extractUploadsRelativePath(
  value?: string | null
): string | null {
  if (!value) return null;

  const sanitized = value.replace(/\\/g, "/").trim();
  if (!sanitized || sanitized.startsWith("data:")) {
    return null;
  }

  if (sanitized.startsWith("/uploads/")) {
    return sanitized;
  }

  if (sanitized.startsWith("uploads/")) {
    return `/${sanitized}`;
  }

  const slashIndex = sanitized.indexOf("/uploads/");
  if (slashIndex !== -1) {
    return sanitized.substring(slashIndex);
  }

  const noSlashIndex = sanitized.indexOf("uploads/");
  if (noSlashIndex !== -1) {
    return `/${sanitized.substring(noSlashIndex)}`;
  }

  return null;
}

export function normalizeUploadsPath(value?: string | null): string {
  if (!value) return "";
  const relative = extractUploadsRelativePath(value);
  if (relative) return relative;
  return value;
}

export function isLocalUploadsUrl(url: string): boolean {
  if (!url) return false;

  if (extractUploadsRelativePath(url)) {
    return true;
  }

  const baseUrl = getBaseUrl();
  const uploadsPrefix = `${baseUrl}/uploads/`;

  return url.startsWith(uploadsPrefix);
}

/**
 * Extract filename from a local uploads URL
 * @param url The uploads URL
 * @returns The filename or null if not a valid uploads URL
 */
export function extractFilenameFromUploadsUrl(url: string): string | null {
  const relative = extractUploadsRelativePath(url);
  if (relative) {
    const withoutPrefix = relative.replace(/^\/uploads\//, "");
    return withoutPrefix || null;
  }

  if (!url) return null;

  const trimmed = url.trim();
  if (!trimmed) return null;

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.includes("/") ||
    trimmed.includes("\\")
  ) {
    return null;
  }

  return trimmed;
}

/**
 * Build a local uploads URL from a filename
 * @param filename The filename
 * @returns The full uploads URL
 */
export function buildUploadsUrl(filename: string): string {
  const baseUrl = getBaseUrl();
  const relative = extractUploadsRelativePath(filename);

  if (relative) {
    const sanitizedRelative = relative.replace(/^\/+/, "");
    return `${baseUrl}/${sanitizedRelative}`;
  }

  const sanitizedFilename = filename.replace(/^\/+/, "");
  if (sanitizedFilename.startsWith("uploads/")) {
    return `${baseUrl}/${sanitizedFilename}`;
  }

  return `${baseUrl}/uploads/${sanitizedFilename}`;
}
