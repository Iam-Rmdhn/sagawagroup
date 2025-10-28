import {
  createCrewController,
  getCrewController,
  getCrewByIdController,
  updateCrewController,
  deleteCrewController,
  crewLoginController,
  getCrewProfileController,
} from "../controllers/crew.controller";

export const crewRoute = (req: Request): Promise<Response> => {
  const url = new URL(req.url);

  // POST /api/crew/login - Crew login
  if (req.method === "POST" && url.pathname === "/api/crew/login") {
    return crewLoginController(req);
  }

  // GET /api/crew/profile - Get crew profile
  if (req.method === "GET" && url.pathname === "/api/crew/profile") {
    return getCrewProfileController(req);
  }

  // POST /api/admin/crew/create - Create new crew
  if (req.method === "POST" && url.pathname === "/api/admin/crew/create") {
    return createCrewController(req);
  }

  // GET /api/admin/crew - Get all crew
  if (req.method === "GET" && url.pathname === "/api/admin/crew") {
    return getCrewController(req);
  }

  // GET /api/admin/crew/:id - Get crew by ID (must be before other GET patterns)
  if (
    req.method === "GET" &&
    url.pathname.startsWith("/api/admin/crew/") &&
    !url.pathname.includes("/status")
  ) {
    const pathParts = url.pathname.split("/");
    // Check if this looks like an ID (not a known endpoint)
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart && lastPart !== "create") {
      return getCrewByIdController(req);
    }
  }

  // PUT /api/admin/crew/:id - Update crew
  if (
    req.method === "PUT" &&
    url.pathname.startsWith("/api/admin/crew/") &&
    !url.pathname.includes("/status")
  ) {
    return updateCrewController(req);
  }

  // DELETE /api/admin/crew/:id - Delete crew
  if (
    req.method === "DELETE" &&
    url.pathname.startsWith("/api/admin/crew/") &&
    !url.pathname.includes("/status")
  ) {
    return deleteCrewController(req);
  }

  return Promise.resolve(
    new Response(
      JSON.stringify({
        success: false,
        error: "Route not found",
      }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    )
  );
};
