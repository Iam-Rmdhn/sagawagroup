// Types
declare global {
    interface Window {
        openEditModal: (id: string) => void;
        confirmDeleteAd: (id: string) => void;
        closeAdsModal: () => void;
        toggleStatus: (id: string) => Promise<void>;

    }
}
