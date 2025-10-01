// Authentication utility functions for admin pages
// This file provides reusable functions for handling token expiration and authentication errors

/**
 * Handle token expiration by showing notification and redirecting to login
 */
export function handleTokenExpiration() {
    console.log('Token expired, redirecting to login...');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    
    // Show notification before redirect
    import('sweetalert2').then(Swal => {
        Swal.default.fire({
            title: "Sesi Berakhir",
            text: "Sesi login Anda telah berakhir. Silakan login kembali.",
            icon: "warning",
            confirmButtonText: "Login",
            allowOutsideClick: false,
            allowEscapeKey: false
        }).then(() => {
            window.location.href = '/admin/login';
        });
    }).catch(() => {
        // Fallback if sweetalert2 fails to load
        alert('Sesi login Anda telah berakhir. Silakan login kembali.');
        window.location.href = '/admin/login';
    });
}

/**
 * Check if a response indicates authentication failure
 * @param {Response} response - The fetch response object
 * @returns {boolean} True if response indicates auth failure
 */
export function isAuthError(response) {
    return !response.ok && (response.status === 401 || response.status === 403);
}

/**
 * Check if an error message indicates JWT token expiration
 * @param {string} message - The error message
 * @returns {boolean} True if message indicates token expiration
 */
export function isTokenExpiredError(message) {
    return message && (message.includes('jwt expired') || message.includes('Invalid token'));
}

/**
 * Make an authenticated API request with automatic token expiration handling
 * @param {string} url - The API endpoint URL
 * @param {object} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise<Response>} The fetch response
 */
export async function authenticatedFetch(url, options = {}) {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        handleTokenExpiration();
        throw new Error('No authentication token found');
    }

    // Merge headers with authorization
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };

    const response = await fetch(url, {
        ...options,
        headers
    });

    // Handle authentication errors
    if (isAuthError(response)) {
        handleTokenExpiration();
        throw new Error('Authentication failed');
    }

    return response;
}

/**
 * Validate admin token and redirect if invalid
 */
export function validateAdminSession() {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('adminToken');
        const user = localStorage.getItem('adminUser');
        if (!token || !user) {
            window.location.href = '/admin/login';
        }
    }
}