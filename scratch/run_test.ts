import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.VITE_CONVEX_URL!);

async function runTest() {
  const result = await client.query(api.test.testTimezone);
  console.log("Test Result:", JSON.stringify(result, null, 2));
}

runTest();
