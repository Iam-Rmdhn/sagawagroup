import { visitorController } from "../controllers/visitor.controller";
import { verifyToken } from "../utils/jwt";

export async function visitorRoute(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  // Public endpoint - track visitor (tidak perlu auth)
  if (path === "/api/visitor/track" && method === "POST") {
    return visitorController.trackVisit(req);
  }

  // Protected endpoints - hanya untuk admin
  // Verify admin token
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Unauthorized - No token provided",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const token = authHeader.substring(7);
  try {
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "admin") {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Unauthorized - Admin access required",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Unauthorized - Invalid token",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Admin endpoints
  if (path === "/api/visitor/stats" && method === "GET") {
    return visitorController.getStats(req);
  }

  if (path === "/api/visitor/recent" && method === "GET") {
    return visitorController.getRecent(req);
  }

  if (path === "/api/visitor/date-range" && method === "GET") {
    return visitorController.getByDateRange(req);
  }

  return new Response(
    JSON.stringify({
      success: false,
      message: "Visitor endpoint not found",
    }),
    {
      status: 404,
      headers: { "Content-Type": "application/json" },
    }
  );
}
