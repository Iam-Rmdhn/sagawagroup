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
