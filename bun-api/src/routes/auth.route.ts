import { MitraPelunasanModel } from "../models/mitra-pelunasan.model";
import { approvePelunasanController } from "../controllers/approve-pelunasan.controller";

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
  getAllUsers,
  getUserById,
  getAllAdmins,
  getAdminById,
} from "../controllers/auth.controller";

export const authRoute = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const pathname = url.pathname;

  // Approve pelunasan endpoint
  if (
    req.method === "POST" &&
    pathname === "/api/admin/mitra_pelunasan/approve"
  ) {
    return await approvePelunasanController(req);
  }

  if (req.method === "GET" && pathname === "/api/admin/mitra_pelunasan") {
    try {
      // Optional: validasi admin token jika ingin
      // await validateAdminToken(req);
      const { MitraModel } = await import("../models/mitra.model");
      const pelunasanList = await MitraPelunasanModel.findAll();
      const result = await Promise.all(
        pelunasanList.map(async (p) => {
          const mitra = await MitraModel.findOne({ email: p.email });
          return {
            ...p,
            namaMitra: mitra?.namaMitra || p.namaMitra || "",
            paketUsaha: mitra?.paketUsaha || p.paketUsaha || "",
            kekurangan: mitra?.kekurangan ?? null,
          };
        })
      );
      return new Response(JSON.stringify({ success: true, data: result }), {
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

  // Delete
  if (
    req.method === "DELETE" &&
    pathname.startsWith("/api/admin/mitra/") &&
    pathname !== "/api/admin/mitra/approve"
  ) {
    return (async () => {
      const id = pathname.split("/api/admin/mitra/")[1];
      if (!id) {
        return new Response(JSON.stringify({ error: "ID wajib diisi" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      try {
        const { deleteMitraService } = await import(
          "../services/auth.services"
        );
        const result = await deleteMitraService(id);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (err) {
        console.error("Error deleting mitra:", err);
        return new Response(
          JSON.stringify({
            error: "Gagal menghapus data mitra",
            success: false,
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    })();
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

  // Delete user
  if (
    req.method === "DELETE" &&
    pathname.startsWith("/api/admin/users/") &&
    pathname !== "/api/admin/users/approve"
  ) {
    return (async () => {
      const id = pathname.split("/api/admin/users/")[1];
      if (!id) {
        return new Response(JSON.stringify({ error: "ID wajib diisi" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      try {
        const { UserModel } = await import("../models/user.model");
        const deleted = await UserModel.deleteOne({ _id: id });
        if (!deleted) {
          return new Response(
            JSON.stringify({ error: "User tidak ditemukan" }),
            {
              status: 404,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
        return new Response(
          JSON.stringify({
            success: true,
            message: "User berhasil dihapus",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      } catch (err) {
        console.error("Error deleting user:", err);
        return new Response(
          JSON.stringify({
            error: "Gagal menghapus user",
            success: false,
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    })();
  }

  // Delete admin
  if (
    req.method === "DELETE" &&
    pathname.startsWith("/api/admin/admins/") &&
    pathname !== "/api/admin/admins/approve"
  ) {
    return (async () => {
      const id = pathname.split("/api/admin/admins/")[1];
      if (!id) {
        return new Response(JSON.stringify({ error: "ID wajib diisi" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      try {
        const { AdminModel } = await import("../models/admin.model");
        const deleted = await AdminModel.deleteOne({ _id: id });
        if (!deleted) {
          return new Response(
            JSON.stringify({ error: "Admin tidak ditemukan" }),
            {
              status: 404,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
        return new Response(
          JSON.stringify({
            success: true,
            message: "Admin berhasil dihapus",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      } catch (err) {
        console.error("Error deleting admin:", err);
        return new Response(
          JSON.stringify({
            error: "Gagal menghapus admin",
            success: false,
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    })();
  }

  if (req.method === "GET" && pathname === "/api/admin/users") {
    return await getAllUsers(req);
  }

  if (
    req.method === "GET" &&
    pathname.startsWith("/api/admin/users/") &&
    pathname !== "/api/admin/users/approve"
  ) {
    return await getUserById(req);
  }

  if (req.method === "GET" && pathname === "/api/admin/admins") {
    return await getAllAdmins(req);
  }

  if (
    req.method === "GET" &&
    pathname.startsWith("/api/admin/admins/") &&
    pathname !== "/api/admin/admins/approve"
  ) {
    return await getAdminById(req);
  }

  return new Response("Not Found", { status: 404 });
};
