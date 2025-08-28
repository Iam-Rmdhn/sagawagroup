import { MitraPelunasanModel } from "../models/mitra-pelunasan.model";

export async function hasPelunasan(email: string): Promise<boolean> {
  try {
    console.log("[DEBUG] Cek pelunasan untuk email:", email);
    const pelunasan = await MitraPelunasanModel.findByEmail(email);
    console.log("[DEBUG] Hasil query mitra_pelunasan:", pelunasan);
    return pelunasan && pelunasan.length > 0;
  } catch (err) {
    console.error("[ERROR] Gagal cek pelunasan:", err, "Email:", email);
    throw err;
  }
}
