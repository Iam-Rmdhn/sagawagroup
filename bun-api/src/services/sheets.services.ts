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
    return ``;
  }

  private getMonthlySheetName(): string {
    const months = [
      "JAN", "FEB", "MAR", "APR", "MEI", "JUN",
      "JUL", "AGU", "SEP", "OKT", "NOV", "DES"
    ];
    const currentMonth = new Date().getMonth();
    return `DAILY ${months[currentMonth]}`;
  }

  async readFinancialData(spreadsheetId: string): Promise<SheetData> {
    try {
      const API_KEY = process.env.GOOGLE_SHEETS_API_KEY;
      if (!API_KEY) throw new Error("API Key Google Sheets belum diset");

      console.log('[Sheets] Reading spreadsheet:', spreadsheetId);
      console.log('[Sheets] API Key available:', !!API_KEY);

      const sheetName = this.getMonthlySheetName();
      const encodedSheetName = encodeURIComponent(sheetName);
      console.log('[Sheets] Using sheet name:', sheetName);

      const [omsetBulanIniRes, profitBulanIniRes] = await Promise.all([
        fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodedSheetName}'!L40?key=${API_KEY}`
        ),
        fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodedSheetName}'!O40?key=${API_KEY}`
        ),
      ]);

      console.log('[Sheets] L40 status:', omsetBulanIniRes.status);
      console.log('[Sheets] O40 status:', profitBulanIniRes.status);

      const omsetBulanIniJson = await omsetBulanIniRes.json();
      const profitBulanIniJson = await profitBulanIniRes.json();

      console.log('[Sheets] Raw L40 response:', JSON.stringify(omsetBulanIniJson));
      console.log('[Sheets] Raw O40 response:', JSON.stringify(profitBulanIniJson));

      const monthlyOmset =
        omsetBulanIniJson &&
          typeof omsetBulanIniJson === "object" &&
          "values" in omsetBulanIniJson &&
          Array.isArray(omsetBulanIniJson.values) &&
          omsetBulanIniJson.values[0]
          ? this.parseCurrency(omsetBulanIniJson.values[0][0])
          : 0;

      const monthlyProfit =
        profitBulanIniJson &&
          typeof profitBulanIniJson === "object" &&
          "values" in profitBulanIniJson &&
          Array.isArray(profitBulanIniJson.values) &&
          profitBulanIniJson.values[0]
          ? this.parseCurrency(profitBulanIniJson.values[0][0])
          : 0;

      console.log('[Sheets] Monthly Data:', { monthlyOmset, monthlyProfit });

      const rangeRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodedSheetName}'!A9:M39?key=${API_KEY}`
      );

      console.log('[Sheets] A9:M39 status:', rangeRes.status);

      const rangeJson = await rangeRes.json() as any;

      console.log('[Sheets] Raw A9:M39 response (first 3 rows):', JSON.stringify(rangeJson?.values?.slice(0, 3)));
      console.log('[Sheets] Total rows received:', rangeJson?.values?.length);

      const rows: any[] =
        rangeJson && typeof rangeJson === "object" && "values" in rangeJson
          ? rangeJson.values
          : [];

      const todayDate = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
      const todayDay = todayDate.getDate();
      let omsetHariIni = 0;
      let belanjaHariIni = 0;
      let totalBelanjaHarian = 0; 
      const history: FinancialData[] = [];

      console.log('[Sheets] Today (Jakarta):', todayDay, todayDate.toISOString());
      console.log('[Sheets] Processing', rows.length, 'rows');

      if (Array.isArray(rows)) {
        for (const row of rows) {
          const dayRaw = row[0]; // Column A: Tanggal
          const dayNumber = Number.parseInt(
            typeof dayRaw === "string" ? dayRaw.trim() : String(dayRaw),
            10
          );
          if (Number.isNaN(dayNumber)) continue;

          // Column L (index 11): REVENUE (Total Omset Harian) - "Offline & Online"
          // Column M (index 12): Belanjaan (Operasional Harian)
          const omset = this.parseCurrency(row[11]);
          const belanja = this.parseCurrency(row[12]);

          // Debug: Log first few rows
          if (history.length < 3) {
            console.log(`[Sheets] Row ${dayNumber}:`, {
              rawL: row[11],
              rawM: row[12],
              parsedOmset: omset,
              parsedBelanja: belanja
            });
          }

          // Akumulasi total belanja untuk perhitungan bulanan
          totalBelanjaHarian += belanja;

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

          // Match today's date to get daily data
          if (dayNumber === todayDay) {
            omsetHariIni = omset;
            belanjaHariIni = belanja;
            console.log('[Sheets] Today data found:', {
              dayNumber,
              rawOmset: row[11],
              rawBelanja: row[12],
              parsedOmset: omset,
              parsedBelanja: belanja
            });
          }
        }
      }

      // Fallback logic removed to strictly show today's data
      if (omsetHariIni === 0 && belanjaHariIni === 0) {
        console.log('[Sheets] No data found for today (or values are 0)');
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

      console.log('[Sheets] Summary:', {
        todayData: { omsetHariIni, belanjaHariIni },
        monthlyData: { totalOmset: monthlyOmset, totalBelanja: totalBelanjaHarian, totalProfit: monthlyProfit },
        weeklyData: { avgOmset, avgBelanja },
        historyLength: history.length
      });

      return {
        today: {
          date: new Date().toISOString().split("T")[0] || "",
          omset: omsetHariIni,
          belanja: belanjaHariIni,
        },
        monthly: {
          totalOmset: monthlyOmset,
          totalBelanja: totalBelanjaHarian,
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
   * Detect correct sheet name by trying common names
   */
  private async detectSheetName(spreadsheetId: string, apiKey: string): Promise<string> {
    // Try to get sheet metadata
    try {
      const metadataRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${apiKey}&fields=sheets.properties.title`
      );

      if (metadataRes.ok) {
        const metadata = await metadataRes.json() as any;
        if (metadata.sheets && Array.isArray(metadata.sheets) && metadata.sheets.length > 0) {
          const firstSheetName = metadata.sheets[0].properties.title;
          console.log('[Sheets] Found first sheet name:', firstSheetName);
          return `${firstSheetName}!`;
        }
      }
    } catch (error) {
      console.log('[Sheets] Could not get metadata, trying common names');
    }

    // Fallback: try common sheet names
    const commonNames = ['DR!', 'Sheet1!', 'Data!', ''];

    for (const name of commonNames) {
      try {
        const testRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${name}A1?key=${apiKey}`
        );

        if (testRes.ok) {
          console.log('[Sheets] Working sheet name found:', name || '(no prefix)');
          return name;
        }
      } catch (error) {
        continue;
      }
    }

    // Default to no prefix
    console.log('[Sheets] Using no sheet name prefix');
    return '';
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
