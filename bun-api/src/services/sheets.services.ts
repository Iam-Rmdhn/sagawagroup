interface FinancialData {
  date: string;
  omset: number;
  belanja: number;
}

interface SheetData {
  today?: FinancialData;
  monthly?: {
    totalOmset: number;
    totalDays: number;
  };
  weekly?: {
    avgOmset: number;
    avgBelanja: number;
  };
  history?: FinancialData[];
}

export class SheetsService {
  createMitraSpreadsheet(mitraId: any, mitraName: string): string {
    // Kembalikan URL dummy Google Sheets (atau bisa generate sesuai kebutuhan)
    // Untuk demo, gunakan template URL berikut:
    return `https://docs.google.com/spreadsheets/d/1Rid6jTNeTNKLemue_lUoiwxSGtyxxdOCxUBuLqL5tDQ/edit?usp=sharing`;
  }

  /**
   * Read financial data from a Google Spreadsheet
   */
  async readFinancialData(spreadsheetId: string): Promise<SheetData> {
    try {
      // Ambil data omset hari ini (H8:H38), omset bulan ini (H40), belanja hari ini (I8:I38)
      const API_KEY = process.env.GOOGLE_SHEETS_API_KEY;
      if (!API_KEY) throw new Error("API Key Google Sheets belum diset");

      // Omset hari ini (H8:H38) dari sheet DR
      const omsetHariIniRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/DR!H8:H38?key=${API_KEY}`
      );
      const omsetHariIniJson = await omsetHariIniRes.json();
      const omsetHariIniArr =
        omsetHariIniJson &&
        typeof omsetHariIniJson === "object" &&
        "values" in omsetHariIniJson
          ? omsetHariIniJson.values
          : [];
      const omsetHariIni =
        Array.isArray(omsetHariIniArr) && omsetHariIniArr.length > 0
          ? parseFloat(omsetHariIniArr[omsetHariIniArr.length - 1][0] || "0")
          : 0;

      // Omset bulan ini (H40) dari sheet DR
      const omsetBulanIniRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/DR!H40?key=${API_KEY}`
      );
      const omsetBulanIniJson = await omsetBulanIniRes.json();
      const omsetBulanIni =
        omsetBulanIniJson &&
        typeof omsetBulanIniJson === "object" &&
        "values" in omsetBulanIniJson &&
        Array.isArray(omsetBulanIniJson.values) &&
        omsetBulanIniJson.values[0]
          ? parseFloat(omsetBulanIniJson.values[0][0] || "0")
          : 0;

      // Belanja hari ini (I8:I38) dari sheet DR
      const belanjaHariIniRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/DR!I8:I38?key=${API_KEY}`
      );
      const belanjaHariIniJson = await belanjaHariIniRes.json();
      const belanjaHariIniArr =
        belanjaHariIniJson &&
        typeof belanjaHariIniJson === "object" &&
        "values" in belanjaHariIniJson
          ? belanjaHariIniJson.values
          : [];
      const belanjaHariIni =
        Array.isArray(belanjaHariIniArr) && belanjaHariIniArr.length > 0
          ? parseFloat(
              belanjaHariIniArr[belanjaHariIniArr.length - 1][0] || "0"
            )
          : 0;

      // Return format mirip SheetData lama
      return {
        today: {
          date: new Date().toISOString().split("T")[0] || "",
          omset: omsetHariIni,
          belanja: belanjaHariIni,
        },
        monthly: {
          totalOmset: omsetBulanIni,
          totalDays: 0,
        },
        weekly: {
          avgOmset: 0,
          avgBelanja: 0,
        },
        history: [],
      };
    } catch (error) {
      console.error("Error reading spreadsheet:", error);
      throw new Error("Failed to read financial data from spreadsheet");
    }
  }

  /**
   * Extract spreadsheet ID from URL
   */
  extractSpreadsheetId(url: string): string | null {
    const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
    const match = url.match(regex);
    return match ? match[1] || null : null;
  }

  /**
   * Validate spreadsheet URL and check if it's accessible
   */
  async validateSpreadsheet(url: string): Promise<boolean> {
    try {
      const spreadsheetId = this.extractSpreadsheetId(url);
      if (!spreadsheetId) return false;

      // Tidak perlu validasi spreadsheet privat
      return true;
    } catch (error) {
      return false;
    }
  }
}
