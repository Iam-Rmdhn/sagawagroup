// Advertisement Service
import { DataAPIClient } from "@datastax/astra-db-ts";
import { ENV } from "../env";
import type {
    IAds,
    CreateAdsInput,
    UpdateAdsInput,
} from "../models/ads.model";
import { randomUUID } from "node:crypto";

// Initialize database
const client = new DataAPIClient(ENV.ASTRA_DB_APPLICATION_TOKEN);
const database = client.db(ENV.ASTRA_DB_API_ENDPOINT);
const adsCollection = database.collection("ads");

// Initialize ads collection
export const initializeAdsCollection = async () => {
    try {
        const collections = await database.listCollections();
        if (!collections.some((col) => col.name === "ads")) {
            await database.createCollection("ads");
            console.log("Created 'ads' collection");
        }
    } catch (error) {
        console.error("Error initializing ads collection:", error);
    }
};

// Create new advertisement
export const createAds = async (input: CreateAdsInput): Promise<IAds> => {
    const now = new Date().toISOString();

    // Determine displayOrder: if not provided, find max + 1
    let displayOrder = input.displayOrder;
    if (displayOrder === undefined || displayOrder === 0) {
        let max = 0;
        // Efficiently find max displayOrder
        const cursor = adsCollection.find({});
        for await (const doc of cursor) {
            const d = doc as unknown as IAds;
            if ((d.displayOrder || 0) > max) max = d.displayOrder || 0;
        }
        displayOrder = max + 1;
    }

    const newAds: IAds = {
        _id: randomUUID(),
        title: input.title,
        description: input.description || "",
        imageUrl: input.imageUrl,
        imageKey: input.imageKey,
        whatsappNumber: input.whatsappNumber,
        whatsappMessage: input.whatsappMessage || "Halo, saya tertarik dengan promo Anda!",
        adLink: input.adLink,
        isActive: input.isActive ?? true,
        displayOrder: displayOrder,
        startDate: input.startDate || "",
        endDate: input.endDate || "",
        clickCount: 0,
        viewCount: 0,
        createdAt: now,
        updatedAt: now,
    };

    await adsCollection.insertOne(newAds);
    return newAds;
};

// Get all advertisements
export const getAllAds = async (): Promise<IAds[]> => {
    const cursor = adsCollection.find({});
    const ads: IAds[] = [];
    for await (const doc of cursor) {
        ads.push(doc as unknown as IAds);
    }
    // Sort by displayOrder and createdAt
    ads.sort((a, b) => {
        if ((a.displayOrder || 0) !== (b.displayOrder || 0)) {
            return (a.displayOrder || 0) - (b.displayOrder || 0);
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return ads;
};

// Get active advertisements (for frontend display)
export const getActiveAds = async (): Promise<IAds[]> => {
    const now = new Date(); // Use Date object
    const nowIso = now.toISOString();
    console.log("[ActiveAds] Checking active ads at Server Time:", nowIso);

    const cursor = adsCollection.find({ isActive: true });
    const ads: IAds[] = [];

    for await (const doc of cursor) {
        const ad = doc as unknown as IAds;

        let startValid = true;
        let endValid = true;

        if (ad.startDate) {
            let sStr = ad.startDate;
            if (sStr && !sStr.endsWith("Z") && !/\+[0-9]{2}:[0-9]{2}$/.test(sStr)) {
                sStr += "+07:00";
            }

            const startDate = new Date(sStr);
            if (startDate > now) {
                startValid = false;
            }
        }

        if (ad.endDate) {
            let eStr = ad.endDate;
            if (eStr && !eStr.endsWith("Z") && !/\+[0-9]{2}:[0-9]{2}$/.test(eStr)) {
                eStr += "+07:00";
            }
            const endDate = new Date(eStr);
            if (endDate < now) {
                endValid = false;
            }
        }

        if (startValid && endValid) {
            ads.push(ad);
        } else {
            console.log(`[ActiveAds] Filtered out '${ad.title}': StartValid=${startValid}, EndValid=${endValid}`);
        }
    }

    // Sort by displayOrder and then createdAt
    ads.sort((a, b) => {
        if ((a.displayOrder || 0) !== (b.displayOrder || 0)) {
            return (a.displayOrder || 0) - (b.displayOrder || 0);
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    console.log(`[ActiveAds] Returning ${ads.length} ads.`);
    return ads;
};

// Get advertisement by ID
export const getAdsById = async (id: string): Promise<IAds | null> => {
    const result = await adsCollection.findOne({ _id: id });
    return result as unknown as IAds | null;
};

// Update advertisement
export const updateAds = async (
    id: string,
    input: UpdateAdsInput
): Promise<IAds | null> => {
    const existingAds = await getAdsById(id);
    if (!existingAds) {
        return null;
    }

    // Build update data without _id (AstraDB doesn't allow updating _id)
    const updateData: Partial<IAds> = {
        title: input.title ?? existingAds.title,
        description: input.description ?? existingAds.description,
        imageUrl: input.imageUrl ?? existingAds.imageUrl,
        imageKey: input.imageKey ?? existingAds.imageKey,
        whatsappNumber: input.whatsappNumber ?? existingAds.whatsappNumber,
        whatsappMessage: input.whatsappMessage ?? existingAds.whatsappMessage,
        adLink: input.adLink ?? existingAds.adLink,
        isActive: input.isActive ?? existingAds.isActive,
        displayOrder: input.displayOrder ?? existingAds.displayOrder,
        startDate: input.startDate ?? existingAds.startDate,
        endDate: input.endDate ?? existingAds.endDate,
        updatedAt: new Date().toISOString(),
    };

    await adsCollection.updateOne({ _id: id }, { $set: updateData });

    // Return the updated document
    return {
        ...existingAds,
        ...updateData,
    };
};

// Delete advertisement
export const deleteAds = async (id: string): Promise<boolean> => {
    const result = await adsCollection.deleteOne({ _id: id });
    return result.deletedCount > 0;
};

// Increment view count
export const incrementViewCount = async (id: string): Promise<void> => {
    await adsCollection.updateOne(
        { _id: id },
        { $inc: { viewCount: 1 } }
    );
};

// Increment click count
export const incrementClickCount = async (id: string): Promise<void> => {
    await adsCollection.updateOne(
        { _id: id },
        { $inc: { clickCount: 1 } }
    );
};

// Toggle active status
export const toggleAdsActive = async (id: string): Promise<IAds | null> => {
    const existingAds = await getAdsById(id);
    if (!existingAds) {
        return null;
    }

    // Only update the fields that need to change (not _id)
    const updateFields = {
        isActive: !existingAds.isActive,
        updatedAt: new Date().toISOString(),
    };

    await adsCollection.updateOne({ _id: id }, { $set: updateFields });

    return {
        ...existingAds,
        ...updateFields,
    };
};

// Reorder advertisements
export const reorderAds = async (idList: string[]): Promise<boolean> => {
    try {
        const operations = idList.map((id, index) => {
            // AstraDB operations are typically one by one or batch.
            // We'll simplisticly update one by one for now or use bulkWrite if available.
            // Since we don't have bulkWrite exposed in this wrapper easily, we loop.
            // Parallelize for speed.
            return adsCollection.updateOne(
                { _id: id },
                { $set: { displayOrder: index + 1, updatedAt: new Date().toISOString() } }
            );
        });

        await Promise.all(operations);
        return true;
    } catch (error) {
        console.error("Error reordering ads:", error);
        return false;
    }
};

// Initialize collection on module load
initializeAdsCollection();
