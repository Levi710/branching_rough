import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import conversationRoutes from './routes/conversations.js';
import branchRoutes from './routes/branches.js';
import { createClerkClient } from '@clerk/backend';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 7860;

const clerk = createClerkClient({ 
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY 
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// User Isolation Middleware (Clerk Auth)
app.use(async (req, res, next) => {
  // Allow health check and static files
  if (req.path.startsWith('/api/health') || !req.path.startsWith('/api')) {
    return next();
  }

  // Allow shared conversation access (Read-Only)
  if (req.path.startsWith('/api/conversations/shared/')) {
    req.userId = 'shared_guest';
    return next();
  }

  try {
    const requestState = await clerk.authenticateRequest(req);
    if (!requestState.isSignedIn) {
      // Legacy support for local development if headers are present (for testing)
      const legacyId = req.headers['x-user-id'];
      if (legacyId && process.env.NODE_ENV !== 'production') {
        req.userId = legacyId;
        return next();
      }
      return res.status(401).json({ error: 'Unauthorized: Please log in' });
    }
    req.userId = requestState.toAuth().userId;
    next();
  } catch (err) {
    console.error('Clerk Auth Error:', err);
    res.status(401).json({ error: 'Authentication failed' });
  }
});

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
