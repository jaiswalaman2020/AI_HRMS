import 'dotenv/config';
import http from 'http';
import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { initSockets } from './sockets/index.js';

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai_hrms');

  const app = createApp();
  const server = http.createServer(app);
  initSockets(server);

  server.listen(PORT, () => {
    console.log(`🚀 AI-HRMS API running on http://localhost:${PORT}`);
    console.log(`   AI provider: ${process.env.AI_PROVIDER || 'groq'} | key set: ${Boolean(process.env.AI_API_KEY)}`);
  });
}

start().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
