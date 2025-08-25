import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

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
  private serviceAccountAuth: JWT;

  constructor() {
    // Initialize Google Sheets authentication
    // You'll need to add Google Sheets API credentials
    this.serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
  }

  /**
   * Create a new Google Spreadsheet for a mitra
   */
  async createMitraSpreadsheet(
    mitraId: string,
    mitraName: string
  ): Promise<string> {
    try {
      // Create new spreadsheet - requires spreadsheet ID and auth
      const doc = new GoogleSpreadsheet("", this.serviceAccountAuth);

      // For now, we'll return a demo URL since creating new spreadsheets
      // requires additional Google Drive API setup
      const demoSpreadsheetId = "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"; // Google's demo sheet
      const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${demoSpreadsheetId}/edit`;

      console.log(
        `✅ Created spreadsheet reference for ${mitraName}: ${spreadsheetUrl}`
      );
      return spreadsheetUrl;
    } catch (error) {
      console.error("Error creating spreadsheet:", error);
      throw new Error("Failed to create Google Spreadsheet");
    }
  }

  /**
   * Get spreadsheet URL for a mitra (or create new one if doesn't exist)
   */
  async getMitraSpreadsheetUrl(mitraId: string): Promise<string> {
    try {
      // Try to get existing URL from database
      // This would typically be stored in your database
      // For now, return a template URL that would be stored per user

      // If no URL exists, create a new spreadsheet
      const mitraName = `Mitra-${mitraId}`; // Get from database in real implementation
      return await this.createMitraSpreadsheet(mitraId, mitraName);
    } catch (error) {
      console.error("Error getting spreadsheet URL:", error);
      throw new Error("Failed to get spreadsheet URL");
    }
  }

  /**
   * Read financial data from a Google Spreadsheet
   */
  async readFinancialData(spreadsheetId: string): Promise<SheetData> {
    try {
      const doc = new GoogleSpreadsheet(spreadsheetId, this.serviceAccountAuth);
      await doc.loadInfo();

      const sheet = doc.sheetsByIndex[0];
      if (!sheet) {
        throw new Error("No sheets found in the spreadsheet");
      }

      const rows = await sheet.getRows();

      if (rows.length === 0) {
        return {};
      }

      // Convert rows to financial data
      const financialData: FinancialData[] = rows
        .map((row) => ({
          date: row.get("Tanggal") || "",
          omset: parseFloat(row.get("Omset") || "0") || 0,
          belanja: parseFloat(row.get("Belanja") || "0") || 0,
        }))
        .filter((item) => item.date && !isNaN(new Date(item.date).getTime()));

      // Sort by date descending
      financialData.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      const today = new Date().toISOString().split("T")[0];
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      // Get today's data
      const todayData = financialData.find((item) => item.date === today);

      // Calculate monthly totals
      const monthlyData = financialData.filter((item) => {
        const itemDate = new Date(item.date);
        return (
          itemDate.getMonth() === currentMonth &&
          itemDate.getFullYear() === currentYear
        );
      });

      const totalOmset = monthlyData.reduce((sum, item) => sum + item.omset, 0);
      const totalDays = monthlyData.length;

      // Calculate 7-day averages
      const last7Days = financialData.slice(0, 7);
      const avgOmset =
        last7Days.length > 0
          ? last7Days.reduce((sum, item) => sum + item.omset, 0) /
            last7Days.length
          : 0;
      const avgBelanja =
        last7Days.length > 0
          ? last7Days.reduce((sum, item) => sum + item.belanja, 0) /
            last7Days.length
          : 0;

      // Get recent history (last 5 entries)
      const history = financialData.slice(0, 5);

      return {
        today: todayData,
        monthly: {
          totalOmset,
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

      const doc = new GoogleSpreadsheet(spreadsheetId, this.serviceAccountAuth);
      await doc.loadInfo();

      return true;
    } catch (error) {
      return false;
    }
  }
}
