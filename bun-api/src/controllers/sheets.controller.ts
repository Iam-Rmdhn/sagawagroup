/**
 * Save Google Sheets URL for the authenticated mitra
 */
export const saveSheetsUrl = async (req: Request): Promise<Response> => {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No authorization token provided",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const mitraId = decoded.id;
    if (!mitraId) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    const body = (await req.json()) as { sheetsUrl?: string };
    const sheetsUrl = body.sheetsUrl;
    if (!sheetsUrl) {
      return new Response(
        JSON.stringify({ success: false, error: "sheetsUrl is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    await saveMitraSheetToDatabase(mitraId, sheetsUrl);
    return new Response(
      JSON.stringify({ success: true, data: { sheetsUrl } }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in saveSheetsUrl:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to save Google Sheets URL",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
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
  // Simpan di file JSON lokal (mitra-sheets.json)
  const fs = await import("fs/promises");
  const path = require("path");
  const filePath = path.join(__dirname, "../../mitra-sheets.json");
  try {
    const data = JSON.parse(await fs.readFile(filePath, "utf8"));
    return data[mitraId] || null;
  } catch (e) {
    return null;
  }
}

async function saveMitraSheetToDatabase(
  mitraId: string,
  sheetsUrl: string
): Promise<void> {
  // Simpan di file JSON lokal (mitra-sheets.json)
  const fs = await import("fs/promises");
  const path = require("path");
  const filePath = path.join(__dirname, "../../mitra-sheets.json");
  let data: Record<string, string> = {};
  try {
    data = JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch (e) {}
  data[mitraId] = sheetsUrl;
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
  console.log(`Saving sheets URL for mitra ${mitraId}: ${sheetsUrl}`);
}
