import {
  recordVisit,
  getVisitorStats,
  getRecentVisitors,
  getVisitorsByDateRange,
} from "../services/visitorTracker";

export const visitorController = {
  // Track visitor - dipanggil setiap kali ada kunjungan
  async trackVisit(req: Request): Promise<Response> {
    try {
      const forwardedFor = req.headers.get("x-forwarded-for");
      const realIp = req.headers.get("x-real-ip");
      const ip =
        (forwardedFor ? forwardedFor.split(",")[0]?.trim() : null) ||
        realIp ||
        "unknown";
      const userAgent = req.headers.get("user-agent") || "unknown";
      const url = new URL(req.url);
      const path = url.pathname;
      const referer = req.headers.get("referer") || undefined;

      await recordVisit(ip, userAgent, path, referer);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Visit recorded successfully",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Error tracking visit:", error);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Failed to track visit",
          error: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },

  // Get visitor statistics (today, this week, this month, total)
  async getStats(req: Request): Promise<Response> {
    try {
      const stats = await getVisitorStats();

      return new Response(JSON.stringify(stats), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error getting visitor stats:", error);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Failed to get visitor stats",
          error: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },

  // Get recent visitors
  async getRecent(req: Request): Promise<Response> {
    try {
      const url = new URL(req.url);
      const limit = parseInt(url.searchParams.get("limit") || "10", 10);

      const visitors = await getRecentVisitors(limit);

      return new Response(
        JSON.stringify({
          success: true,
          data: visitors,
          count: visitors.length,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Error getting recent visitors:", error);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Failed to get recent visitors",
          error: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },

  // Get visitors by date range
  async getByDateRange(req: Request): Promise<Response> {
    try {
      const url = new URL(req.url);
      const startDate = url.searchParams.get("startDate");
      const endDate = url.searchParams.get("endDate");

      if (!startDate || !endDate) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "startDate and endDate query parameters are required",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const visitors = await getVisitorsByDateRange(startDate, endDate);

      return new Response(
        JSON.stringify({
          success: true,
          data: visitors,
          count: visitors.length,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Error getting visitors by date range:", error);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Failed to get visitors by date range",
          error: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },
};
