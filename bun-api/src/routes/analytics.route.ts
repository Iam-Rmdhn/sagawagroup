import { ENV } from "../env";

// Enhanced visitor tracking with time-based statistics
let totalVisitors = 0;
let activeVisitors = 0;
let totalPageViews = 0;
const visitorSessions = new Map<string, number>();

// Time-based visitor tracking
interface VisitorEntry {
  sessionId: string;
  timestamp: number;
  date: string; // YYYY-MM-DD format
}

const visitorHistory: VisitorEntry[] = [];
const dailyVisitors = new Map<string, Set<string>>(); // date -> Set of sessionIds

// Helper function to get date string
function getDateString(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toISOString().split('T')[0] || ''; // YYYY-MM-DD
}

// Helper function to get visitors for a date range
function getVisitorsInRange(startDate: Date, endDate: Date): number {
  const uniqueVisitors = new Set<string>();
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  
  visitorHistory.forEach(entry => {
    if (entry.timestamp >= startTime && entry.timestamp <= endTime) {
      uniqueVisitors.add(entry.sessionId);
    }
  });
  
  return uniqueVisitors.size;
}

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
  
  // Clean up old visitor history (keep last 90 days)
  const ninetyDaysAgo = now - (90 * 24 * 60 * 60 * 1000);
  const oldLength = visitorHistory.length;
  for (let i = visitorHistory.length - 1; i >= 0; i--) {
    const entry = visitorHistory[i];
    if (entry && entry.timestamp < ninetyDaysAgo) {
      visitorHistory.splice(i, 1);
    }
  }
  
  // Clean up old daily visitors
  const thirtyDaysAgo = getDateString(now - (30 * 24 * 60 * 60 * 1000));
  for (const [date] of dailyVisitors.entries()) {
    if (date < thirtyDaysAgo) {
      dailyVisitors.delete(date);
    }
  }
  
  console.log(`[Analytics] Cleaned up ${removed} inactive sessions, ${oldLength - visitorHistory.length} old history entries. Active visitors: ${activeVisitors}`);
}, 5 * 60 * 1000);

export async function analyticsRoute(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const origin = req.headers.get("origin") || "";

  // Define allowed origins for production
  const allowedOrigins = [
    "https://sagawagroup.id",
    "https://www.sagawagroup.id",
    "https://admin.sagawagroup.id",
    "https://tes.bun.tams.my.id"  // Test domain
  ];

  // Determine the appropriate CORS origin
  let allowedOrigin = "*";

  if (process.env.NODE_ENV === "development") {
    // In development, allow any origin
    allowedOrigin = origin || "*";
  } else {
    // In production, only allow specific origins
    if (origin && allowedOrigins.includes(origin)) {
      allowedOrigin = origin;
    } else {
      // Default to the main domain if no valid origin is provided
      allowedOrigin = "https://www.sagawagroup.id";
    }
  }

  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept, Origin",
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin",
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
      const now = Date.now();
      const today = getDateString(now);
      
      // Check if this is a new session
      const isNewSession = !visitorSessions.has(sessionId);
      
      // Update session activity
      visitorSessions.set(sessionId, now);
      activeVisitors = visitorSessions.size;
      
      // Track visitor in history if new session
      if (isNewSession) {
        totalVisitors++;
        visitorHistory.push({
          sessionId,
          timestamp: now,
          date: today
        });
        
        // Track in daily visitors
        if (!dailyVisitors.has(today)) {
          dailyVisitors.set(today, new Set());
        }
        dailyVisitors.get(today)?.add(sessionId);
      }
      
      // Track page views
      if (eventType === "pageview") {
        totalPageViews++;
      }
      
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
      const now = Date.now();
      
      // Calculate date ranges
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Get visitor counts for different periods
      const visitorsToday = getVisitorsInRange(today, tomorrow);
      const visitorsWeek = getVisitorsInRange(weekAgo, tomorrow);
      const visitorsMonth = getVisitorsInRange(monthAgo, tomorrow);
      
      return new Response(
        JSON.stringify({
          success: true,
          totalVisitors: totalVisitors,
          activeVisitors: activeVisitors,
          totalPageViews: totalPageViews,
          visitorsToday: visitorsToday,
          visitorsWeek: visitorsWeek,
          visitorsMonth: visitorsMonth,
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
