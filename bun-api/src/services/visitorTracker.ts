import { DataAPIClient } from "@datastax/astra-db-ts";
import { ENV } from "../env";

interface VisitorRecord {
  _id?: string;
  ip: string;
  userAgent: string;
  timestamp: string; // ISO-8601 stored in UTC
  path?: string;
  referer?: string;
  country?: string;
  city?: string;
}

// Use existing ENV configuration for consistency with the project
const client = new DataAPIClient(ENV.ASTRA_DB_APPLICATION_TOKEN);
const database = client.db(ENV.ASTRA_DB_API_ENDPOINT);
const visitorCollection = database.collection<VisitorRecord>("visitor");

export async function recordVisit(
  ip: string,
  userAgent: string,
  path?: string,
  referer?: string
): Promise<void> {
  const timestamp = new Date().toISOString();
  await visitorCollection.insertOne({
    ip,
    userAgent,
    timestamp,
    path,
    referer,
  });
}

const getUtcRangeStart = (initializer: (base: Date) => void): string => {
  const now = new Date();
  const base = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  initializer(base);
  return base.toISOString();
};

export async function getVisitorStats(): Promise<{
  today: number;
  thisWeek: number;
  thisMonth: number;
  total: number;
}> {
  // Recompute ranges on each call so the counters stay aligned with the current UTC time window
  const startOfToday = getUtcRangeStart(() => {});
  const startOfWeek = getUtcRangeStart((base) => {
    base.setUTCDate(base.getUTCDate() - base.getUTCDay());
  });
  const startOfMonth = getUtcRangeStart((base) => {
    base.setUTCDate(1);
  });

  // Use find().toArray() and count manually as countDocuments may need different parameters
  const [todayResults, thisWeekResults, thisMonthResults, totalResults] = await Promise.all([
    visitorCollection.find({ timestamp: { $gte: startOfToday } }).toArray(),
    visitorCollection.find({ timestamp: { $gte: startOfWeek } }).toArray(),
    visitorCollection.find({ timestamp: { $gte: startOfMonth } }).toArray(),
    visitorCollection.find({}).toArray(),
  ]);

  return {
    today: todayResults.length,
    thisWeek: thisWeekResults.length,
    thisMonth: thisMonthResults.length,
    total: totalResults.length,
  };
}

export async function getRecentVisitors(limit: number = 10): Promise<VisitorRecord[]> {
  const results = await visitorCollection
    .find({}, { sort: { timestamp: -1 }, limit })
    .toArray();
  return results;
}

export async function getVisitorsByDateRange(
  startDate: string,
  endDate: string
): Promise<VisitorRecord[]> {
  const results = await visitorCollection
    .find({
      timestamp: {
        $gte: startDate,
        $lte: endDate,
      },
    })
    .toArray();
  return results;
}
