import { ENV } from "../env";

// Simple in-memory visitor tracking
let visitorCount = 0;
let activeVisitors = 0;
let totalPageViews = 0;
const visitorSessions = new Map<string, number>();

// Clean up old sessions every 5 minutes
setInterval(() => {
  const now = Date.now();
  const timeout = 5 * 60 * 1000; // 5 minutes timeout
  
  let removed = 0;
  for (const [sessionId, lastActivity] of visitorSessions.entries()) {
    if (now - lastActivity > timeout) {
      visitorSessions.delete(sessionId);
      removed++;
    }
  }
  
  activeVisitors = visitorSessions.size;
  console.log(`[Analytics] Cleaned up ${removed} inactive sessions. Active visitors: ${activeVisitors}`);
}, 5 * 60 * 1000);

export async function analyticsRoute(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;

  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // Handle preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Track visitor
    if (path === "/api/analytics/track" && req.method === "POST") {
      const body = await req.json() as { sessionId?: string; eventType?: string };
      const sessionId = body.sessionId || crypto.randomUUID();
      const eventType = body.eventType || "pageview";
      
      // Update session activity
      visitorSessions.set(sessionId, Date.now());
      
      if (eventType === "pageview") {
        totalPageViews++;
      }
      
      if (!visitorSessions.has(sessionId)) {
        visitorCount++;
      }
      
      activeVisitors = visitorSessions.size;
      
      return new Response(
        JSON.stringify({
          success: true,
          sessionId: sessionId,
          activeVisitors: activeVisitors,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Get visitor stats (for admin dashboard)
    if (path === "/api/analytics/stats" && req.method === "GET") {
      return new Response(
        JSON.stringify({
          totalVisitors: visitorCount,
          activeVisitors: activeVisitors,
          totalPageViews: totalPageViews,
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Heartbeat to keep session alive
    if (path === "/api/analytics/heartbeat" && req.method === "POST") {
      const body = await req.json() as { sessionId?: string };
      const sessionId = body.sessionId;
      
      if (sessionId && visitorSessions.has(sessionId)) {
        visitorSessions.set(sessionId, Date.now());
        activeVisitors = visitorSessions.size;
        
        return new Response(
          JSON.stringify({
            success: true,
            activeVisitors: activeVisitors,
          }),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }
      
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid session",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Route not found",
      }),
      {
        status: 404,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("[Analytics] Error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
}
