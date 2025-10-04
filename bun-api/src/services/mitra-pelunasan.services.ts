import { MitraPelunasanModel } from "../models/mitra-pelunasan.model";

export async function hasPelunasan(email: string): Promise<boolean> {
  try {
    const pelunasan = await MitraPelunasanModel.findByEmail(email);
    // Hanya return true jika ada pelunasan yang statusPelunasan bukan 'lunas'
    return (
      pelunasan &&
      pelunasan.some((p) => !p.statusPelunasan || p.statusPelunasan !== "lunas")
    );
  } catch (err) {
    throw err;
  }
}

export async function deletePelunasanById(
  id: string
): Promise<{ success: boolean; message: string }> {
  try {
    const deleted = await MitraPelunasanModel.deleteOne({ _id: id });
    if (deleted) {
      return { success: true, message: "Data pelunasan berhasil dihapus" };
    } else {
      return { success: false, message: "Data pelunasan tidak ditemukan" };
    }
  } catch (err) {
    console.error("Error deleting pelunasan:", err);
    throw new Error("Gagal menghapus data pelunasan");
  }
}

export async function deletePelunasanByMitraId(
  mitraId: string
): Promise<{ success: boolean; message: string; deletedCount: number }> {
  try {
    const deletedCount = await MitraPelunasanModel.deleteMany({ mitraId });
    if (deletedCount > 0) {
      return { 
        success: true, 
        message: `${deletedCount} data pelunasan berhasil dihapus`,
        deletedCount 
      };
    } else {
      return { 
        success: true, 
        message: "Tidak ada data pelunasan yang ditemukan untuk mitra ini",
        deletedCount: 0 
      };
    }
  } catch (err) {
    console.error("Error deleting pelunasan by mitra ID:", err);
    throw new Error("Gagal menghapus data pelunasan berdasarkan mitra ID");
  }
}
