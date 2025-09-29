import { authRoute } from "./src/routes/auth.route";
import { mitraRoute } from "./src/routes/mitra.route";
import { sheetsRoute } from "./src/routes/sheets.route";
import { agreementRoute } from "./src/routes/agreement.route";
import { youtubeRoute } from "./src/routes/youtube.route";
import "./src/lib/db"; // Initialize database connection
import { ENV } from "./src/env";

// Use the port from our environment configuration
const PORT = ENV.PORT;

Bun.serve({
  port: PORT,
  hostname: "0.0.0.0", // Allow access from any IP address
  async fetch(req) {
    const url = new URL(req.url);
    const host = req.headers.get("host") || "";
    const origin = req.headers.get("origin") || "";
    const isAdminSubdomain = host.includes("admin.sagawagroup.id");

    // Add comprehensive CORS headers to handle Chrome's stricter policies
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, X-Requested-With, Accept, Origin, X-Api-Key, X-Auth-Token, Cache-Control, Pragma, Expires",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Max-Age": "86400",
      Vary: "Origin",
    };

    // Enhanced CORS for admin subdomain or when origin is specified
    if (isAdminSubdomain || origin) {
      // For development, allow localhost origins
      if (ENV.NODE_ENV === "development") {
        corsHeaders["Access-Control-Allow-Origin"] = origin || "*";
      } else {
        corsHeaders["Access-Control-Allow-Origin"] =
          origin || `https://${host}`;
      }
      corsHeaders["Vary"] = "Origin";
    }

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    try {
      // Health check endpoint with subdomain info
      if (url.pathname === "/api/health") {
        return new Response(
          JSON.stringify({
            status: "OK",
            timestamp: new Date().toISOString(),
            service: "Sagawa Group API",
            subdomain: isAdminSubdomain ? "admin" : "main",
            host: host,
            port: PORT,
            environment: ENV.NODE_ENV,
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

      // Special handling for mitra_pelunasan DELETE requests
      if (
        req.method === "DELETE" &&
        url.pathname.startsWith("/api/admin/mitra_pelunasan/") &&
        url.pathname !== "/api/admin/mitra_pelunasan/approve"
      ) {
        const response = await mitraRoute(req);
        // Add CORS headers to response
        Object.entries(corsHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
        return response;
      }

      // Route handling
      if (
        url.pathname.startsWith("/api/auth") ||
        url.pathname.startsWith("/api/admin") ||
        url.pathname === "/api/mitra/profile" ||
        url.pathname === "/api/mitra/profile/update"
      ) {
        const response = await authRoute(req);
        // Add CORS headers to response
        Object.entries(corsHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
        return response;
      }

      // Google Sheets routes
      if (
        url.pathname.startsWith("/api/mitra/sheets") ||
        url.pathname === "/api/mitra/create-sheets" ||
        url.pathname === "/api/mitra/validate-sheets" ||
        url.pathname === "/api/mitra/sheets-data" ||
        url.pathname === "/api/sheets/omset"
      ) {
        const response = await sheetsRoute(req);
        // Add CORS headers to response
        Object.entries(corsHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
        return response;
      }

      // Agreement routes
      if (
        url.pathname === "/api/mitra/agreement-status" ||
        url.pathname === "/api/mitra/accept-agreement" ||
        url.pathname === "/api/mitra/agreements"
      ) {
        const response = await agreementRoute(req);
        // Add CORS headers to response
        Object.entries(corsHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
        return response;
      }

      // YouTube routes
      if (url.pathname.startsWith("/api/youtube")) {
        const response = await youtubeRoute(req);
        // Add CORS headers to response
        Object.entries(corsHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
        return response;
      }

      if (url.pathname.startsWith("/api/mitra")) {
        const response = await mitraRoute(req);
        // Add CORS headers to response
        Object.entries(corsHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
        return response;
      }

      // Serve uploaded files
      if (url.pathname.startsWith("/uploads/")) {
        try {
          const fileName = decodeURIComponent(
            url.pathname.substring("/uploads/".length)
          ); // Remove /uploads/ and decode URL
          const filePath = `./uploads/${fileName}`;
          console.log(`Requested file: "${fileName}" -> Path: "${filePath}"`);
          const file = Bun.file(filePath);

          if (await file.exists()) {
            console.log(`File found: "${filePath}"`);
            return new Response(file, {
              headers: {
                ...corsHeaders,
                "Content-Type": file.type || "application/octet-stream",
              },
            });
          } else {
            console.log(`File not found: "${filePath}"`);
          }
        } catch (error) {
          console.error("Error serving file:", error);
        }

        return new Response("File not found", {
          status: 404,
          headers: corsHeaders,
        });
      }

      // Default response
      return new Response("API Server is running", {
        status: 200,
        headers: corsHeaders,
      });
    } catch (error) {
      console.error("Server error:", error);
      return new Response("Internal Server Error", {
        status: 500,
        headers: corsHeaders,
      });
    }
  },
});

console.log(`Server running on http://0.0.0.0:${PORT}`);
console.log(`Environment: ${ENV.NODE_ENV}`);
console.log(`AstraDB connection initialized`);
