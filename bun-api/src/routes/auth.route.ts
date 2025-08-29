import { MitraPelunasanModel } from "../models/mitra-pelunasan.model";
import {
  loginMitra,
  adminLogin,
  adminRegister,
  getAllMitra,
  getMitraById,
  approveMitra,
  updateMitraImages,
  getMitraProfile,
  updateMitraProfile,
} from "../controllers/auth.controller";

export const authRoute = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const pathname = url.pathname;

  if (req.method === "GET" && pathname === "/api/admin/mitra_pelunasan") {
    try {
      // Optional: validasi admin token jika ingin
      // await validateAdminToken(req);
      const data = await MitraPelunasanModel.findAll();
      return new Response(JSON.stringify({ success: true, data }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Gagal mengambil data pelunasan",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  if (req.method === "POST" && pathname === "/api/auth/login") {
    return await loginMitra(req);
  }

  if (req.method === "POST" && pathname === "/api/admin/login") {
    return await adminLogin(req);
  }

  if (req.method === "POST" && pathname === "/api/admin/register") {
    return await adminRegister(req);
  }

  if (req.method === "GET" && pathname === "/api/admin/mitra") {
    return await getAllMitra(req);
  }

  if (
    req.method === "GET" &&
    pathname.startsWith("/api/admin/mitra/") &&
    pathname !== "/api/admin/mitra/approve"
  ) {
    return await getMitraById(req);
  }

  if (req.method === "POST" && pathname === "/api/admin/mitra/approve") {
    return await approveMitra(req);
  }

  if (req.method === "GET" && pathname === "/api/admin/sample-images") {
    return await updateMitraImages(req);
  }

  if (req.method === "GET" && pathname === "/api/mitra/profile") {
    return await getMitraProfile(req);
  }

  if (req.method === "PUT" && pathname === "/api/mitra/profile/update") {
    return await updateMitraProfile(req);
  }

  return new Response("Not Found", { status: 404 });
};
