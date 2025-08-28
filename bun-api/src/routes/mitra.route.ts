import {
  approveMitraController,
  registerMitraController,
} from "../controllers/mitra.controller";

export const mitraRoute = (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  // GET /api/mitra/by-email?email=xxx
  if (req.method === "GET" && url.pathname === "/api/mitra/by-email") {
    return (async () => {
      const email = url.searchParams.get("email");
      if (!email) {
        return new Response(JSON.stringify({ error: "email wajib diisi" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      try {
        const { getMitraByEmail } = await import("../services/getMitraByEmail");
        const mitra = await getMitraByEmail(email);
        if (!mitra) {
          return new Response(
            JSON.stringify({ error: "Mitra tidak ditemukan" }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          );
        }
        return new Response(JSON.stringify(mitra), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (err) {
        return new Response(
          JSON.stringify({ error: "Gagal mengambil data mitra" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    })();
  }

  if (req.method === "POST" && url.pathname === "/api/mitra/register") {
    return registerMitraController(req);
  }

  if (req.method === "POST" && url.pathname === "/api/mitra/approve") {
    return approveMitraController(req);
  }

  // GET /api/mitra/me?userID=xxx
  if (req.method === "GET" && url.pathname === "/api/mitra/me") {
    return (async () => {
      const userID = url.searchParams.get("userID");
      if (!userID) {
        return new Response(JSON.stringify({ error: "userID wajib diisi" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      try {
        const { getMitraByUserId } = await import(
          "../services/getMitraByUserId"
        );
        const mitra = await getMitraByUserId(userID);
        if (!mitra) {
          return new Response(
            JSON.stringify({ error: "Mitra tidak ditemukan" }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          );
        }
        return new Response(JSON.stringify(mitra), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (err) {
        return new Response(
          JSON.stringify({ error: "Gagal mengambil data mitra" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    })();
  }

  return Promise.resolve(new Response("Not Found", { status: 404 }));
};
