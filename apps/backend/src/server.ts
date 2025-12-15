/**
 * LN Stocks API Server
 * 
 * Main entry point - clean and minimal
 */

import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PORT, HOST, logApiKeysStatus } from './constants/config';
import { healthRoute } from './routes/healthRoute';
import { quotesRoute } from './routes/quotesRoute';
import { seriesRoute } from './routes/seriesRoute';
import { searchRoute } from './routes/searchRoute';

// Initialize server
const app = Fastify({ logger: true });

// Register CORS
await app.register(cors, { origin: true });

// Log API key status
logApiKeysStatus();

// Register routes
app.get('/', healthRoute);
app.get('/v1/quotes', quotesRoute);
app.get('/v1/series', seriesRoute);
app.get('/v1/search', searchRoute);

// Start server
app.listen({ port: PORT, host: HOST }).catch((error) => {
  app.log.error(error);
  process.exit(1);
});

console.log(`🚀 LN Stocks API running on http://${HOST}:${PORT}`);
