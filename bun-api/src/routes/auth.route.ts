import {
  loginMitra,
  getMitraProfile,
  getAllMitraLogin,
  adminLogin,
  adminRegister,
  getAllMitra,
  getMitraById,
  approveMitra,
  updateMitraImages,
} from "../controllers/auth.controller";

export const authRoute = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const pathname = url.pathname;

  if (req.method === "POST" && pathname === "/api/auth/login") {
    return await loginMitra(req);
  }

  // Endpoint untuk mitra mendapatkan profile
  if (req.method === "GET" && pathname === "/api/mitra/profile") {
    return await getMitraProfile(req);
  }

  // Endpoint untuk admin mendapatkan semua mitra login
  if (req.method === "GET" && pathname === "/api/admin/mitra-login") {
    return await getAllMitraLogin(req);
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

  return new Response("Not Found", { status: 404 });
};
