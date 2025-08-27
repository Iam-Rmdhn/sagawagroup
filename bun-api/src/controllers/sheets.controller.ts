import { SheetsService } from "../services/sheets.services";
import jwt from "jsonwebtoken";

const sheetsService = new SheetsService();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

/**
 * Get or create Google Sheets URL for the authenticated mitra
 */
export const getSheetsUrl = async (req: Request): Promise<Response> => {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No authorization token provided",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const mitraId = decoded.id;

    if (!mitraId) {
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

    // Get or create spreadsheet URL for this mitra
    let sheetsUrl = await getMitraSheetFromDatabase(mitraId);

    if (!sheetsUrl) {
      // Create new spreadsheet
      sheetsUrl = await sheetsService.createMitraSpreadsheet(
        mitraId,
        `Mitra-${mitraId}`
      );

      // Save to database
      await saveMitraSheetToDatabase(mitraId, sheetsUrl);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          sheetsUrl,
          mitraId,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in getSheetsUrl:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to get Google Sheets URL",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * Create new Google Sheets for the authenticated mitra
 */
export const createSheets = async (req: Request): Promise<Response> => {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No authorization token provided",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const mitraId = decoded.id;

    if (!mitraId) {
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

    // Get mitra name from database (mock for now)
    const mitraName = `Mitra-${mitraId}`;

    // Create new spreadsheet
    const sheetsUrl = await sheetsService.createMitraSpreadsheet(
      mitraId,
      mitraName
    );

    // Save to database
    await saveMitraSheetToDatabase(mitraId, sheetsUrl);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          sheetsUrl,
          message: "Google Sheets successfully created",
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in createSheets:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to create Google Sheets",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * Get financial data from Google Sheets for the authenticated mitra
 */
export const getSheetsData = async (req: Request): Promise<Response> => {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No authorization token provided",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const mitraId = decoded.id;

    if (!mitraId) {
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

    // Get spreadsheet URL for this mitra
    const sheetsUrl = await getMitraSheetFromDatabase(mitraId);

    if (!sheetsUrl) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "No Google Sheets found for this user. Please create one first.",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Extract spreadsheet ID from URL
    const spreadsheetId = sheetsService.extractSpreadsheetId(sheetsUrl);

    if (!spreadsheetId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid spreadsheet URL",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Read financial data from spreadsheet
    const data = await sheetsService.readFinancialData(spreadsheetId);

    return new Response(
      JSON.stringify({
        success: true,
        data,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in getSheetsData:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to read data from Google Sheets",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * Validate Google Sheets URL
 */
export const validateSheetsUrl = async (req: Request): Promise<Response> => {
  try {
    const body = (await req.json()) as { url?: string };
    const { url } = body;

    if (!url) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "URL is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const isValid = await sheetsService.validateSpreadsheet(url);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          isValid,
          message: isValid
            ? "Spreadsheet is accessible"
            : "Spreadsheet is not accessible",
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in validateSheetsUrl:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to validate spreadsheet URL",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// Database helper functions (these would be replaced with actual database calls)

async function getMitraSheetFromDatabase(
  mitraId: string
): Promise<string | null> {
  // In a real implementation, this would query your database
  // For now, return null to simulate no existing sheet

  // Example query:
  // SELECT sheets_url FROM mitra WHERE id = ? AND sheets_url IS NOT NULL

  return null; // This will trigger creation of new sheet
}

async function saveMitraSheetToDatabase(
  mitraId: string,
  sheetsUrl: string
): Promise<void> {
  // In a real implementation, this would save to your database
  // For now, just log

  console.log(`Saving sheets URL for mitra ${mitraId}: ${sheetsUrl}`);

  // Example query:
  // UPDATE mitra SET sheets_url = ?, updated_at = NOW() WHERE id = ?
}
