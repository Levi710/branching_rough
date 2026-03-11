import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import conversationRoutes from './routes/conversations.js';
import branchRoutes from './routes/branches.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/conversations', conversationRoutes);
app.use('/api/branches', branchRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files from the React frontend app
const distPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(distPath));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🔮 Atonement backend running on http://localhost:${PORT}`);
});
