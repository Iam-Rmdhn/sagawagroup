import { loginMitra } from "../controllers/auth.controller";

export const authRoute = async (req: Request): Promise<Response> => {
  if (
    req.method === "POST" &&
    new URL(req.url).pathname === "/api/auth/login"
  ) {
    return await loginMitra(req);
  }

  return new Response("Not Found", { status: 404 });
};
