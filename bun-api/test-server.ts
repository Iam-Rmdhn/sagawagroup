// Simple test server for deployment testing
console.log("Starting test server...");

const server = Bun.serve({
  port: 4000,
  fetch(request) {
    const url = new URL(request.url);
    
    console.log(`${new Date().toISOString()} - ${request.method} ${url.pathname}`);
    
    // Health check endpoint
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ 
        status: "healthy", 
        timestamp: new Date().toISOString(),
        service: "sagawa-backend-test"
      }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    
    // API root
    if (url.pathname === "/" || url.pathname === "/api") {
      return new Response(JSON.stringify({ 
        message: "Sagawa Group API - Test Server Running", 
        version: "1.0.0",
        timestamp: new Date().toISOString()
      }), {
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
      });
    }
    
    // Test endpoints
    if (url.pathname === "/api/test") {
      return new Response(JSON.stringify({ 
        message: "Test endpoint working", 
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      }), {
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
      });
    }
    
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`🚀 Test server running at http://localhost:${server.port}`);
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Health check: http://localhost:${server.port}/health`);