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
      const API_KEY = process.env.GOOGLE_SHEETS_API_KEY;
      if (!API_KEY) throw new Error("API Key Google Sheets belum diset");

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
          ? parseFloat(
              (omsetBulanIniJson.values[0][0] || "0")
                .toString()
                .replace(/Rp|\.|,|\s/g, "")
            )
          : 0;

      // Ambil data tanggal, omset, belanja hari ini dari DR!A8:I38
      const rangeRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/DR!A8:I38?key=${API_KEY}`
      );
      const rangeJson = await rangeRes.json();
      const rows =
        rangeJson && typeof rangeJson === "object" && "values" in rangeJson
          ? rangeJson.values
          : [];
      const todayDate = new Date();
      const todayDay = todayDate.getDate().toString();
      let omsetHariIni = 0;
      let belanjaHariIni = 0;
      if (Array.isArray(rows)) {
        for (const row of rows) {
          // Cek jika kolom A adalah nomor hari dan sama dengan hari ini
          if (row[0] && row[0].toString().trim() === todayDay) {
            omsetHariIni = parseFloat(
              (row[7] || "0").toString().replace(/Rp|\.|,|\s/g, "")
            );
            belanjaHariIni = parseFloat(
              (row[8] || "0").toString().replace(/Rp|\.|,|\s/g, "")
            );
            break;
          }
        }
      }

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
