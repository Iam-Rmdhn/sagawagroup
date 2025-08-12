import { approveMitraController } from "../controllers/mitra.controller";

export const mitraRoute = (req: Request): Promise<Response> => {
  if (
    req.method === "POST" &&
    new URL(req.url).pathname === "/api/mitra/approve"
  ) {
    return approveMitraController(req);
  }

  return Promise.resolve(new Response("Not Found", { status: 404 }));
};
