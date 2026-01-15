// Advertisement Routes
import {
    uploadAdsImageController,
    createAdsController,
    getAllAdsController,
    getActiveAdsController,
    getAdsByIdController,
    updateAdsController,
    deleteAdsController,
    toggleAdsActiveController,
    trackAdsViewController,
    trackAdsClickController,
    reorderAdsController,
} from "../controllers/ads.controller";

export const adsRoute = (req: Request): Promise<Response> => {
    const url = new URL(req.url);

    // === PUBLIC ROUTES (for frontend) ===

    // GET /api/ads/active - Get active advertisements (public)
    if (req.method === "GET" && url.pathname === "/api/ads/active") {
        return getActiveAdsController(req);
    }

    // POST /api/ads/:id/view - Track view (public)
    if (
        req.method === "POST" &&
        url.pathname.match(/^\/api\/ads\/[^/]+\/view$/)
    ) {
        return trackAdsViewController(req);
    }

    // POST /api/ads/:id/click - Track click (public)
    if (
        req.method === "POST" &&
        url.pathname.match(/^\/api\/ads\/[^/]+\/click$/)
    ) {
        return trackAdsClickController(req);
    }

    // === ADMIN ROUTES ===

    // POST /api/admin/ads/upload - Upload advertisement image
    if (req.method === "POST" && url.pathname === "/api/admin/ads/upload") {
        return uploadAdsImageController(req);
    }

    // POST /api/admin/ads/reorder - Reorder advertisements
    if (req.method === "POST" && url.pathname === "/api/admin/ads/reorder") {
        return reorderAdsController(req);
    }

    // POST /api/admin/ads/create - Create new advertisement
    if (req.method === "POST" && url.pathname === "/api/admin/ads/create") {
        return createAdsController(req);
    }

    // GET /api/admin/ads - Get all advertisements
    if (req.method === "GET" && url.pathname === "/api/admin/ads") {
        return getAllAdsController(req);
    }

    // GET /api/admin/ads/:id - Get advertisement by ID
    if (
        req.method === "GET" &&
        url.pathname.startsWith("/api/admin/ads/") &&
        !url.pathname.includes("/toggle") &&
        !url.pathname.includes("/upload")
    ) {
        return getAdsByIdController(req);
    }

    // PUT /api/admin/ads/:id - Update advertisement
    if (
        req.method === "PUT" &&
        url.pathname.startsWith("/api/admin/ads/") &&
        !url.pathname.includes("/toggle")
    ) {
        return updateAdsController(req);
    }

    // PUT /api/admin/ads/:id/toggle - Toggle active status
    if (
        req.method === "PUT" &&
        url.pathname.match(/^\/api\/admin\/ads\/[^/]+\/toggle$/)
    ) {
        return toggleAdsActiveController(req);
    }

    // DELETE /api/admin/ads/:id - Delete advertisement
    if (
        req.method === "DELETE" &&
        url.pathname.startsWith("/api/admin/ads/")
    ) {
        return deleteAdsController(req);
    }

    return Promise.resolve(
        new Response(
            JSON.stringify({
                success: false,
                error: "Route not found",
            }),
            {
                status: 404,
                headers: { "Content-Type": "application/json" },
            }
        )
    );
};
