import jwt from "jsonwebtoken";
import { AgreementService } from "../services/agreement.services";

/**
 * Get agreement status for the authenticated mitra
 */
export const getAgreementStatus = async (req: Request): Promise<Response> => {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No authorization header provided",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No token provided",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    ) as any;
    const mitraId = decoded.id || decoded.mitraId;

    if (!mitraId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid token: no mitra ID found",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log(`🔍 Checking agreement status for mitra: ${mitraId}`);

    // Check if mitra has accepted agreement
    const hasAccepted = await AgreementService.hasAcceptedAgreement(mitraId);
    const agreementDetails = hasAccepted
      ? await AgreementService.getAgreementDetails(mitraId)
      : null;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          mitraId,
          hasAccepted,
          agreementDetails,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error getting agreement status:", error);

    if (error instanceof jwt.JsonWebTokenError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid token",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * Accept agreement for the authenticated mitra
 */
export const acceptAgreement = async (req: Request): Promise<Response> => {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No authorization header provided",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No token provided",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    ) as any;
    const mitraId = decoded.id || decoded.mitraId;

    if (!mitraId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid token: no mitra ID found",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get request data
    const body = (await req.json()) as {
      acceptedAt?: string;
      userAgent?: string;
    };
    const { acceptedAt, userAgent } = body;

    // Get client IP address (simplified for this implementation)
    const ipAddress =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    console.log(`💾 Processing agreement acceptance for mitra: ${mitraId}`);

    // Save agreement
    const result = await AgreementService.acceptAgreement(mitraId, {
      acceptedAt: acceptedAt || new Date().toISOString(),
      userAgent,
      ipAddress,
    });

    if (result.success) {
      console.log(`✅ Agreement successfully processed for mitra: ${mitraId}`);

      return new Response(
        JSON.stringify({
          success: true,
          message: result.message,
          data: {
            mitraId,
            agreementId: result.agreementId,
            acceptedAt: acceptedAt || new Date().toISOString(),
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      console.log(
        `❌ Agreement processing failed for mitra: ${mitraId}`,
        result.message
      );

      return new Response(
        JSON.stringify({
          success: false,
          error: result.message,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("❌ Error accepting agreement:", error);

    if (error instanceof jwt.JsonWebTokenError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid token",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
