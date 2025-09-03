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
    const email = decoded.email;

    if (!mitraId || !email) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid token: missing mitra ID or email",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log(
      `🔍 Checking agreement status for mitra: ${mitraId} (${email})`
    );

    // Check if mitra has accepted agreement using email
    const hasAccepted = await AgreementService.hasAcceptedAgreement(email);
    const agreementDetails = hasAccepted
      ? await AgreementService.getAgreementDetails(email)
      : null;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          mitraId,
          email,
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
      namaMitra?: string;
      noHp?: string;
      email?: string;
      sistemKemitraan?: string;
      alamat?: string;
      nilaiPaketUsaha?: string;
      agreementVersion?: string;
      agreementContent?: {
        title: string;
        signatureDeclaration: string;
        acceptedTerms: boolean;
      };
    };
    const {
      acceptedAt,
      userAgent,
      namaMitra,
      noHp,
      email,
      sistemKemitraan,
      alamat,
      nilaiPaketUsaha,
      agreementVersion,
      agreementContent,
    } = body;

    // Get client IP address (simplified for this implementation)
    const ipAddress =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    console.log(`💾 Processing agreement acceptance for mitra: ${mitraId}`);
    console.log(`📋 Agreement data:`, {
      namaMitra,
      email,
      sistemKemitraan,
      nilaiPaketUsaha,
      agreementVersion,
    });

    // Save agreement with complete mitra information
    const result = await AgreementService.acceptAgreement(mitraId, {
      acceptedAt: acceptedAt || new Date().toISOString(),
      userAgent,
      ipAddress,
      namaMitra,
      noHp,
      email,
      sistemKemitraan,
      alamat,
      nilaiPaketUsaha,
      agreementVersion,
      agreementContent,
    });

    if (result.success) {
      console.log(`Agreement successfully processed for mitra: ${mitraId}`);

      return new Response(
        JSON.stringify({
          success: true,
          message: result.message,
          data: {
            mitraId,
            agreementId: result.agreementId,
            acceptedAt: acceptedAt || new Date().toISOString(),
            namaMitra,
            noHp,
            email,
            sistemKemitraan,
            alamat,
            nilaiPaketUsaha,
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      console.log(
        `Agreement processing failed for mitra: ${mitraId}`,
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

/**
 * Get all agreements (admin endpoint)
 */
export const getAllAgreements = async (req: Request): Promise<Response> => {
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

    // Check if user is admin (you might want to add role checking here)
    const isAdmin = decoded.role === "admin" || decoded.isAdmin === true;
    if (!isAdmin) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Admin access required",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log(`📋 Getting all agreements for admin`);

    // Get all agreements
    const agreements = await AgreementService.getAllAgreements();

    return new Response(
      JSON.stringify({
        success: true,
        data: agreements,
        count: agreements.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error getting all agreements:", error);

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
