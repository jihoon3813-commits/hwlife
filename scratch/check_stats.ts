import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const client = new ConvexHttpClient("https://careful-yak-108.convex.cloud"); // I need to find the actual URL

async function checkStats() {
  const stats = await client.query(api.stats.getDashboardStats, { period: "today" });
  console.log(JSON.stringify(stats.ipLogs, null, 2));
}

checkStats();
