import {
  getSheetsUrl,
  createSheets,
  getSheetsData,
  validateSheetsUrl,
} from "../controllers/sheets.controller";

export const sheetsRoute = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const pathname = url.pathname;

  // Get or create Google Sheets URL for mitra
  if (req.method === "GET" && pathname === "/api/mitra/sheets-url") {
    return await getSheetsUrl(req);
  }

  // Create new Google Sheets for mitra
  if (req.method === "POST" && pathname === "/api/mitra/create-sheets") {
    return await createSheets(req);
  }

  // Get financial data from Google Sheets
  if (req.method === "GET" && pathname === "/api/mitra/sheets-data") {
    return await getSheetsData(req);
  }

  // Validate Google Sheets URL
  if (req.method === "POST" && pathname === "/api/mitra/validate-sheets") {
    return await validateSheetsUrl(req);
  }

  return new Response(
    JSON.stringify({
      success: false,
      error: "Route not found",
    }),
    {
      status: 404,
      headers: { "Content-Type": "application/json" },
    }
  );
};
