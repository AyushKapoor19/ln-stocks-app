/**
 * LN Stocks API Server
 *
 * Main entry point - clean and minimal
 */

import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { PORT, HOST, logApiKeysStatus } from "./constants/config.js";
import { testConnection } from "./utils/db.js";
import { healthRoute } from "./routes/healthRoute.js";
import { quotesRoute } from "./routes/quotesRoute.js";
import { seriesRoute } from "./routes/seriesRoute.js";
import { searchRoute } from "./routes/searchRoute.js";
import { enhancedSearchRoute } from "./routes/enhancedSearchRoute.js";
import { indexStatusRoute } from "./routes/indexStatusRoute.js";
import { metricsRoute } from "./routes/metricsRoute.js";
import { stockIndexService } from "./services/stockIndexService.js";
import {
  signupRoute,
  loginRoute,
  verifyTokenRoute,
} from "./routes/authRoutes.js";
import {
  generateDeviceCodeRoute,
  checkDeviceCodeStatusRoute,
  approveDeviceCodeRoute,
  verifyDeviceCodeRoute,
  approveDeviceCodeWithSignUpRoute,
} from "./routes/deviceCodeRoutes.js";

// Initialize server
const app = Fastify({ logger: true });

// Register CORS
await app.register(cors, { origin: true });

// Log API key status
logApiKeysStatus();

// Test database connection
await testConnection();

// Initialize stock index for production-grade search (BLOCKING)
console.log("🚀 Initializing stock search index...");
try {
  await stockIndexService.initialize();
  console.log("✅ Stock index ready!");
} catch (error) {
  console.error("❌ Failed to initialize stock index:", error);
  console.log("⚠️ Search will return empty results until index is ready");
}

// Register stock data routes
app.get("/", healthRoute);
app.get("/v1/quotes", quotesRoute);
app.get("/v1/series", seriesRoute);
app.get("/v1/search", searchRoute); // Legacy search (Finnhub direct)
app.get("/v1/search/enhanced", enhancedSearchRoute); // Production-grade search
app.get("/v1/search/index-status", indexStatusRoute); // Index health check
app.get("/v1/metrics", metricsRoute);

// Register auth routes
app.post("/auth/signup", signupRoute);
app.post("/auth/login", loginRoute);
app.get("/auth/verify", verifyTokenRoute);

// Register device code routes (for TV authentication)
app.post("/auth/device-code/generate", generateDeviceCodeRoute);
app.get("/auth/device-code/status", checkDeviceCodeStatusRoute);
app.post("/auth/device-code/verify", verifyDeviceCodeRoute);
app.post("/auth/device-code/approve", approveDeviceCodeRoute);
app.post("/auth/device-code/approve-signup", approveDeviceCodeWithSignUpRoute);

// Start server
app.listen({ port: PORT, host: HOST }).catch((error) => {
  app.log.error(error);
  process.exit(1);
});

console.log(`LN Stocks API running on http://${HOST}:${PORT}`);
