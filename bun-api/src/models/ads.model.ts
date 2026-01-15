// Advertisement Model
export interface IAds {
    _id?: string;
    title: string;
    description?: string;
    imageUrl: string;
    imageKey: string; // Key di Supabase Storage
    whatsappNumber: string;
    whatsappMessage?: string;
    adLink?: string;
    isActive: boolean;
    displayOrder: number;
    startDate?: string;
    endDate?: string;
    clickCount: number;
    viewCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateAdsInput {
    title: string;
    description?: string;
    imageUrl: string;
    imageKey: string;
    whatsappNumber: string;
    whatsappMessage?: string;
    adLink?: string;
    isActive?: boolean;
    displayOrder?: number;
    startDate?: string;
    endDate?: string;
}

export interface UpdateAdsInput {
    title?: string;
    description?: string;
    imageUrl?: string;
    imageKey?: string;
    whatsappNumber?: string;
    whatsappMessage?: string;
    adLink?: string;
    isActive?: boolean;
    displayOrder?: number;
    startDate?: string;
    endDate?: string;
}
