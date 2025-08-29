import { MitraPelunasanModel } from "../models/mitra-pelunasan.model";
import { UserModel } from "../models/user.model";

export const approvePelunasanController = async (
  req: Request
): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop();
    if (!id) {
      return new Response(
        JSON.stringify({ error: "ID pelunasan wajib diisi" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    // Update status pelunasan di mitra_pelunasan
    await MitraPelunasanModel.updateById(id, { statusPelunasan: "lunas" });
    // Cari data pelunasan untuk ambil email mitra
    const pelunasan = await MitraPelunasanModel.findById(id);
    if (pelunasan && pelunasan.email) {
      // Update status di user/mitra
      await UserModel.updateOne(
        { email: pelunasan.email },
        { isPaidOff: true, statusPelunasan: "lunas" }
      );
    }
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Gagal approve pelunasan" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
