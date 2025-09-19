// Utility functions for handling dynamic URLs

/**
 * Get the base URL for the application based on environment
 * @returns The base URL (e.g., http://localhost:6000 or https://www.sagawagroup.id)
 */
export function getBaseUrl(): string {
  // Check if we're in a Bun environment
  if (typeof process !== 'undefined' && process.env) {
    // Use BASE_URL from environment if available
    if (process.env.BASE_URL) {
      return process.env.BASE_URL.replace(/\/$/, ''); // Remove trailing slash
    }
    
    // Default based on NODE_ENV
    if (process.env.NODE_ENV === 'production') {
      return 'https://www.sagawagroup.id';
    } else {
      // For development, use the PORT from environment or default to 6000
      const port = process.env.PORT || '6000';
      return `http://localhost:${port}`;
    }
  }
  
  // Fallback
  return 'http://localhost:6000';
}

/**
 * Check if a URL is a local uploads URL
 * @param url The URL to check
 * @returns True if the URL is a local uploads URL
 */
export function isLocalUploadsUrl(url: string): boolean {
  if (!url) return false;
  
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
  if (!isLocalUploadsUrl(url)) return null;
  
  try {
    const baseUrl = getBaseUrl();
    const uploadsPrefix = `${baseUrl}/uploads/`;
    return url.substring(uploadsPrefix.length);
  } catch (error) {
    console.error('Error extracting filename from URL:', error);
    return null;
  }
}

/**
 * Build a local uploads URL from a filename
 * @param filename The filename
 * @returns The full uploads URL
 */
export function buildUploadsUrl(filename: string): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/uploads/${filename}`;
}