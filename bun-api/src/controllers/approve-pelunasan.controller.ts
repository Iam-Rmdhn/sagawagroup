import { MitraPelunasanModel } from "../models/mitra-pelunasan.model";
import { UserModel } from "../models/user.model";
import { MitraModel } from "../models/mitra.model";

export const approvePelunasanController = async (
  req: Request
): Promise<Response> => {
  try {
    const { email, namaMitra } = (await req.json()) as {
      email?: string;
      namaMitra?: string;
    };
    console.log("[APPROVE] email diterima:", email, "namaMitra:", namaMitra);
    let pelunasan = null;
    if (email) {
      pelunasan = await MitraPelunasanModel.findOne({ email });
    } else if (namaMitra) {
      pelunasan = await MitraPelunasanModel.findOne({ namaMitra });
    }
    if (!pelunasan) {
      return new Response(
        JSON.stringify({ error: "Data pelunasan tidak ditemukan" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    // Update status pelunasan
    await MitraPelunasanModel.updateById(pelunasan._id!, {
      statusPelunasan: "lunas",
    });
    // Update status di user/mitra jika ada email
    if (pelunasan.email) {
      await UserModel.updateOne(
        { email: pelunasan.email },
        { isPaidOff: true, statusPelunasan: "lunas" }
      );
      // Also update the MitraModel directly
      await MitraModel.updateOne(
        { email: pelunasan.email },
        { isPaidOff: true, statusPelunasan: "lunas" }
      );
    }
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[APPROVE ERROR]", error);
    return new Response(
      JSON.stringify({
        error: "Gagal approve pelunasan",
        detail: String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
