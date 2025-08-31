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
