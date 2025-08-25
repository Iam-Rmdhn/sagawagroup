import {
  getAgreementStatus,
  acceptAgreement,
} from "../controllers/agreement.controller";

export const agreementRoute = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const pathname = url.pathname;

  console.log(`🔀 Agreement route: ${req.method} ${pathname}`);

  // GET /api/mitra/agreement-status
  if (req.method === "GET" && pathname === "/api/mitra/agreement-status") {
    console.log(
      "📋 GET /api/mitra/agreement-status - Getting agreement status"
    );
    return await getAgreementStatus(req);
  }

  // POST /api/mitra/accept-agreement
  if (req.method === "POST" && pathname === "/api/mitra/accept-agreement") {
    console.log("💾 POST /api/mitra/accept-agreement - Accepting agreement");
    return await acceptAgreement(req);
  }

  // Route not found
  return new Response(
    JSON.stringify({
      success: false,
      error: "Agreement route not found",
    }),
    {
      status: 404,
      headers: { "Content-Type": "application/json" },
    }
  );
};
