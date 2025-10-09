// Service Worker Unregistration Script
// This script forces browsers to unregister any old service workers
// Place this in your main HTML or run it on page load

(function() {
    'use strict';
    
    // Check if service workers are supported
    if ('serviceWorker' in navigator) {
        // Get all registered service workers
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
            if (registrations.length > 0) {
                console.log('[SW Cleanup] Found ' + registrations.length + ' service worker(s)');
                
                // Unregister all service workers
                for (let registration of registrations) {
                    registration.unregister().then(function(success) {
                        if (success) {
                            console.log('[SW Cleanup] Service worker unregistered successfully');
                        }
                    });
                }
                
                // Clear all caches
                if ('caches' in window) {
                    caches.keys().then(function(cacheNames) {
                        return Promise.all(
                            cacheNames.map(function(cacheName) {
                                console.log('[SW Cleanup] Deleting cache: ' + cacheName);
                                return caches.delete(cacheName);
                            })
                        );
                    }).then(function() {
                        console.log('[SW Cleanup] All caches cleared');
                    });
                }
            } else {
                console.log('[SW Cleanup] No service workers found');
            }
        }).catch(function(error) {
            console.error('[SW Cleanup] Error checking service workers:', error);
        });
    }
    
    // Note: Cache version checking removed to prevent infinite reload
    // Nginx handles cache control with proper headers
    console.log('[SW Cleanup] Service worker cleanup completed');
})();
