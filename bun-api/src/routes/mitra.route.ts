import {
  approveMitraController,
  registerMitraController,
} from "../controllers/mitra.controller";

export const mitraRoute = (req: Request): Promise<Response> => {
  const url = new URL(req.url);

  if (req.method === "POST" && url.pathname === "/api/mitra/register") {
    return registerMitraController(req);
  }

  if (req.method === "POST" && url.pathname === "/api/mitra/approve") {
    return approveMitraController(req);
  }

  return Promise.resolve(new Response("Not Found", { status: 404 }));
};
