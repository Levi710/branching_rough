import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import conversationRoutes from './routes/conversations.js';
import branchRoutes from './routes/branches.js';

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

// Start server
app.listen(PORT, () => {
  console.log(`🔮 Atonement backend running on http://localhost:${PORT}`);
});
