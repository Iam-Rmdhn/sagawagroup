// Advertisement Controller
import {
    createAds,
    getAllAds,
    getActiveAds,
    getAdsById,
    updateAds,
    deleteAds,
    incrementViewCount,
    incrementClickCount,
    toggleAdsActive,
    reorderAds,
} from "../services/ads.services";
import {
    uploadAdsImageToSupabase,
    isSupabaseStorageEnabled,
    deleteFileFromSupabase,
} from "../utils/supabaseStorage";
import type { CreateAdsInput, UpdateAdsInput } from "../models/ads.model";

// Helper function to create JSON response
const jsonResponse = (data: object, status: number = 200) => {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" },
    });
};

// Upload advertisement image to Supabase
export const uploadAdsImageController = async (
    req: Request
): Promise<Response> => {
    try {
        if (!isSupabaseStorageEnabled()) {
            return jsonResponse(
                { success: false, error: "Supabase storage is not configured" },
                503
            );
        }

        const formData = await req.formData();
        const fileEntry = formData.get("image");
        const file = fileEntry as unknown as File;

        if (!file) {
            return jsonResponse(
                { success: false, error: "No image file provided" },
                400
            );
        }

        // Validate file type
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowedTypes.includes(file.type)) {
            return jsonResponse(
                { success: false, error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" },
                400
            );
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return jsonResponse(
                { success: false, error: "File size exceeds 5MB limit" },
                400
            );
        }

        // Upload to Supabase Storage (photoIklan bucket)
        const result = await uploadAdsImageToSupabase(file);

        console.log("✅ [Upload Success] Image uploaded to photoIklan");
        console.log("   Key:", result.key);
        console.log("   Public URL:", result.publicUrl);

        return jsonResponse({
            success: true,
            message: "Image uploaded successfully",
            data: {
                key: result.key,
                publicUrl: result.publicUrl,
            },
        });
    } catch (error) {
        console.error("Error uploading ads image:", error);
        return jsonResponse(
            { success: false, error: "Failed to upload image" },
            500
        );
    }
};

// Create new advertisement
export const createAdsController = async (req: Request): Promise<Response> => {
    try {
        const body = (await req.json()) as CreateAdsInput;
        const { title, description, imageUrl, imageKey, whatsappNumber, whatsappMessage, adLink, isActive, displayOrder, startDate, endDate } = body;

        if (!title || !imageUrl || !imageKey || !whatsappNumber) {
            return jsonResponse(
                { success: false, error: "Title, image, and WhatsApp number are required" },
                400
            );
        }

        const newAds = await createAds({
            title,
            description,
            imageUrl,
            imageKey,
            whatsappNumber,
            whatsappMessage,
            adLink,
            isActive,
            displayOrder,
            startDate,
            endDate,
        });

        return jsonResponse({
            success: true,
            message: "Advertisement created successfully",
            data: newAds,
        });
    } catch (error) {
        console.error("Error creating advertisement:", error);
        return jsonResponse(
            { success: false, error: "Failed to create advertisement" },
            500
        );
    }
};

// Get all advertisements (admin)
export const getAllAdsController = async (
    _req: Request
): Promise<Response> => {
    try {
        const ads = await getAllAds();
        return jsonResponse({
            success: true,
            data: ads,
            count: ads.length,
        });
    } catch (error) {
        console.error("Error fetching advertisements:", error);
        return jsonResponse(
            { success: false, error: "Failed to fetch advertisements" },
            500
        );
    }
};

// Get active advertisements (public)
export const getActiveAdsController = async (
    _req: Request
): Promise<Response> => {
    try {
        const ads = await getActiveAds();
        return jsonResponse({
            success: true,
            data: ads,
            count: ads.length,
        });
    } catch (error) {
        console.error("Error fetching active advertisements:", error);
        return jsonResponse(
            { success: false, error: "Failed to fetch advertisements" },
            500
        );
    }
};

// Get advertisement by ID
export const getAdsByIdController = async (
    req: Request
): Promise<Response> => {
    try {
        const url = new URL(req.url);
        const pathParts = url.pathname.split("/");
        const id = pathParts[pathParts.length - 1];

        if (!id) {
            return jsonResponse({ success: false, error: "ID is required" }, 400);
        }

        const ads = await getAdsById(id);
        if (!ads) {
            return jsonResponse(
                { success: false, error: "Advertisement not found" },
                404
            );
        }

        return jsonResponse({
            success: true,
            data: ads,
        });
    } catch (error) {
        console.error("Error fetching advertisement:", error);
        return jsonResponse(
            { success: false, error: "Failed to fetch advertisement" },
            500
        );
    }
};

// Update advertisement
export const updateAdsController = async (req: Request): Promise<Response> => {
    try {
        const url = new URL(req.url);
        const pathParts = url.pathname.split("/");
        const id = pathParts[pathParts.length - 1];

        if (!id) {
            return jsonResponse({ success: false, error: "ID is required" }, 400);
        }

        const body = (await req.json()) as UpdateAdsInput;
        const updatedAds = await updateAds(id, body);

        if (!updatedAds) {
            return jsonResponse(
                { success: false, error: "Advertisement not found" },
                404
            );
        }

        return jsonResponse({
            success: true,
            message: "Advertisement updated successfully",
            data: updatedAds,
        });
    } catch (error) {
        console.error("Error updating advertisement:", error);
        return jsonResponse(
            { success: false, error: "Failed to update advertisement" },
            500
        );
    }
};

// Delete advertisement
export const deleteAdsController = async (req: Request): Promise<Response> => {
    try {
        const url = new URL(req.url);
        const pathParts = url.pathname.split("/");
        const id = pathParts[pathParts.length - 1];

        if (!id) {
            return jsonResponse({ success: false, error: "ID is required" }, 400);
        }

        // 1. Get ad details first to get imageKey
        const ad = await getAdsById(id);
        if (!ad) {
            return jsonResponse(
                { success: false, error: "Advertisement not found" },
                404
            );
        }

        // 2. Delete image from Supabase if key exists
        if (ad.imageKey) {
            await deleteFileFromSupabase(ad.imageKey, "photoIklan");
        }

        // 3. Delete ad record from DB
        const deleted = await deleteAds(id);
        if (!deleted) {
            return jsonResponse(
                { success: false, error: "Failed to delete advertisement record" },
                404
            );
        }

        return jsonResponse({
            success: true,
            message: "Advertisement and associated image deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting advertisement:", error);
        return jsonResponse(
            { success: false, error: "Failed to delete advertisement" },
            500
        );
    }
};

export const reorderAdsController = async (req: Request): Promise<Response> => {
    try {
        const body = (await req.json()) as { ids: string[] };
        if (!body.ids || !Array.isArray(body.ids)) {
            return jsonResponse({ success: false, error: "Invalid IDs format" }, 400);
        }

        const success = await reorderAds(body.ids);

        if (success) {
            return jsonResponse({ success: true, message: "Ads reordered successfully" });
        } else {
            return jsonResponse({ success: false, error: "Failed to reorder ads" }, 500);
        }

    } catch (error) {
        console.error("Error reordering ads:", error);
        return jsonResponse(
            { success: false, error: "Failed to reorder ads" },
            500
        );
    }
};

// Toggle advertisement active status
export const toggleAdsActiveController = async (
    req: Request
): Promise<Response> => {
    try {
        const url = new URL(req.url);
        const pathParts = url.pathname.split("/");
        // Pattern: /api/admin/ads/:id/toggle
        const id = pathParts[pathParts.length - 2];

        if (!id) {
            return jsonResponse({ success: false, error: "ID is required" }, 400);
        }

        const updatedAds = await toggleAdsActive(id);
        if (!updatedAds) {
            return jsonResponse(
                { success: false, error: "Advertisement not found" },
                404
            );
        }

        return jsonResponse({
            success: true,
            message: `Advertisement ${updatedAds.isActive ? "activated" : "deactivated"} successfully`,
            data: updatedAds,
        });
    } catch (error) {
        console.error("Error toggling advertisement:", error);
        return jsonResponse(
            { success: false, error: "Failed to toggle advertisement" },
            500
        );
    }
};

// Track advertisement view
export const trackAdsViewController = async (
    req: Request
): Promise<Response> => {
    try {
        const url = new URL(req.url);
        const pathParts = url.pathname.split("/");
        // Pattern: /api/ads/:id/view
        const id = pathParts[pathParts.length - 2];

        if (!id) {
            return jsonResponse({ success: false, error: "ID is required" }, 400);
        }

        await incrementViewCount(id);
        return jsonResponse({ success: true, message: "View tracked" });
    } catch (error) {
        console.error("Error tracking view:", error);
        return jsonResponse({ success: false, error: "Failed to track view" }, 500);
    }
};

// Track advertisement click
export const trackAdsClickController = async (
    req: Request
): Promise<Response> => {
    try {
        const url = new URL(req.url);
        const pathParts = url.pathname.split("/");
        // Pattern: /api/ads/:id/click
        const id = pathParts[pathParts.length - 2];

        if (!id) {
            return jsonResponse({ success: false, error: "ID is required" }, 400);
        }

        await incrementClickCount(id);
        return jsonResponse({ success: true, message: "Click tracked" });
    } catch (error) {
        console.error("Error tracking click:", error);
        return jsonResponse(
            { success: false, error: "Failed to track click" },
            500
        );
    }
};
