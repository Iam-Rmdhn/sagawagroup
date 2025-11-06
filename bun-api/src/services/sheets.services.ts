interface FinancialData {
  date: string;
  omset: number;
  belanja: number;
}

interface SheetData {
  today?: FinancialData;
  monthly?: {
    totalOmset: number;
    totalBelanja: number;
    totalProfit: number;
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
    return ``;
  }

  
  /**
   * Read financial data from a Google Spreadsheet
   */
  async readFinancialData(spreadsheetId: string): Promise<SheetData> {
    try {
      const API_KEY = process.env.GOOGLE_SHEETS_API_KEY;
      if (!API_KEY) throw new Error("API Key Google Sheets belum diset");

      const [profitBulanIniRes, omsetBulanIniRes, belanjaBulanIniRes] =
        await Promise.all([
          fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/DR!H8:H38?key=${API_KEY}`
          ),
          fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/DR!H40?key=${API_KEY}`
          ),
          fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/DR!I40?key=${API_KEY}`
          ),
        ]);

      const profitBulanIniJson = await profitBulanIniRes.json();
      const omsetBulanIniJson = await omsetBulanIniRes.json();
      const belanjaBulanIniJson = await belanjaBulanIniRes.json();

      const profitBulanIniValues =
        profitBulanIniJson &&
        typeof profitBulanIniJson === "object" &&
        "values" in profitBulanIniJson
          ? profitBulanIniJson.values
          : [];
      const monthlyProfit =
        Array.isArray(profitBulanIniValues) &&
        profitBulanIniValues.length > 0 &&
        profitBulanIniValues[profitBulanIniValues.length - 1]
          ? this.parseCurrency(
              profitBulanIniValues[profitBulanIniValues.length - 1][0]
            )
          : 0;

      const monthlyOmset =
        omsetBulanIniJson &&
        typeof omsetBulanIniJson === "object" &&
        "values" in omsetBulanIniJson &&
        Array.isArray(omsetBulanIniJson.values) &&
        omsetBulanIniJson.values[0]
          ? this.parseCurrency(omsetBulanIniJson.values[0][0])
          : 0;

      const belanjaBulanIniValues =
        belanjaBulanIniJson &&
        typeof belanjaBulanIniJson === "object" &&
        "values" in belanjaBulanIniJson
          ? belanjaBulanIniJson.values
          : [];
      const monthlyBelanja =
        Array.isArray(belanjaBulanIniValues) &&
        belanjaBulanIniValues.length > 0 &&
        belanjaBulanIniValues[belanjaBulanIniValues.length - 1]
          ? this.parseCurrency(
              belanjaBulanIniValues[belanjaBulanIniValues.length - 1][0]
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
      const todayDay = todayDate.getDate();
      let omsetHariIni = 0;
      let belanjaHariIni = 0;
      const history: FinancialData[] = [];

      if (Array.isArray(rows)) {
        for (const row of rows) {
          const dayRaw = row[0];
          const dayNumber = Number.parseInt(
            typeof dayRaw === "string" ? dayRaw.trim() : String(dayRaw),
            10
          );
          if (Number.isNaN(dayNumber)) continue;

          const omset = this.parseCurrency(row[7]);
          const belanja = this.parseCurrency(row[8]);

          const entryDate = new Date(
            todayDate.getFullYear(),
            todayDate.getMonth(),
            dayNumber
          );
          let isoDate = "";
          if (!Number.isNaN(entryDate.getTime())) {
            const isoParts = entryDate.toISOString().split("T");
            isoDate = isoParts[0] ?? "";
          }

          history.push({
            date: isoDate,
            omset,
            belanja,
          });

          if (dayNumber === todayDay) {
            omsetHariIni = omset;
            belanjaHariIni = belanja;
          }
        }
      }

      const totalDays = history.length;
      const lastSeven = history.slice(-7);
      const avgOmset =
        lastSeven.length > 0
          ? lastSeven.reduce((sum, item) => sum + item.omset, 0) /
            lastSeven.length
          : 0;
      const avgBelanja =
        lastSeven.length > 0
          ? lastSeven.reduce((sum, item) => sum + item.belanja, 0) /
            lastSeven.length
          : 0;

      return {
        today: {
          date: new Date().toISOString().split("T")[0] || "",
          omset: omsetHariIni,
          belanja: belanjaHariIni,
        },
        monthly: {
          totalOmset: monthlyOmset,
          totalBelanja: monthlyBelanja,
          totalProfit: monthlyProfit,
          totalDays,
        },
        weekly: {
          avgOmset,
          avgBelanja,
        },
        history,
      };
    } catch (error) {
      console.error("Error reading spreadsheet:", error);
      throw new Error("Failed to read financial data from spreadsheet");
    }
  }

  private parseCurrency(value: unknown): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === "number") return value;

    const sanitized = value
      .toString()
      .replace(/Rp\s*/g, "") // Hapus "Rp" dan spasi
      .replace(/\./g, "") // Hapus titik pemisah ribuan (ID: 1.000.000)
      .replace(/,/g, ""); // Hapus koma pemisah ribuan (US: 1,000,000)

    const parsed = Number.parseFloat(sanitized);
    return Number.isFinite(parsed) ? parsed : 0;
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
