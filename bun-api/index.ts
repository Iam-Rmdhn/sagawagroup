import { authRoute } from "./src/routes/auth.route";
import { mitraRoute } from "./src/routes/mitra.route";
import "./src/lib/db"; // Initialize database connection
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 9999;

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // Add CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    try {
      // Route handling
      if (
        url.pathname.startsWith("/api/auth") ||
        url.pathname.startsWith("/api/admin")
      ) {
        const response = await authRoute(req);
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
          const filePath = url.pathname.substring(1); // Remove leading slash
          const file = Bun.file(filePath);

          if (await file.exists()) {
            return new Response(file, {
              headers: {
                ...corsHeaders,
                "Content-Type": file.type || "application/octet-stream",
              },
            });
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

console.log(`Server running on http://localhost:${PORT}`);
console.log(`AstraDB connection initialized`);
