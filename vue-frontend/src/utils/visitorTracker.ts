// Auto Visitor Tracking Script
// This script automatically tracks page visits

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000';

export async function trackPageVisit() {
  try {
    // Don't track admin pages or API calls
    if (window.location.pathname.startsWith('/admin') || 
        window.location.pathname.startsWith('/api')) {
      return;
    }

    const response = await fetch(`${API_URL}/api/visitor/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: window.location.pathname,
        referer: document.referrer || undefined,
      }),
    });

    if (!response.ok) {
      console.warn('Failed to track visit');
    }
  } catch (error) {
    // Silently fail - don't disrupt user experience
    console.debug('Visitor tracking error:', error);
  }
}

// Auto-track on page load (only once per page)
if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin')) {
  // Track after page is fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trackPageVisit);
  } else {
    trackPageVisit();
  }
}
