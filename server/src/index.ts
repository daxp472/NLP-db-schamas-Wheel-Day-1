import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ENV, validateEnv } from './config/env';
import { connectMongo, isMongoConnected } from './db/mongo';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import contactRoutes from './routes/contact.routes';
import invitationRoutes from './routes/invitation.routes';
import { InvitationController } from './controllers/invitation.controller';
import { requireAuth } from './middleware/auth';

const app = express();

// Security Headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: ENV.FRONTEND_URL,
    credentials: true,
  })
);

// Body Parser with strict limit
app.use(express.json({ limit: '500kb' }));

// Rate Limiting on AI generation
const aiRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 25, // limit each IP to 25 AI generation requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many schema generation requests. Please try again later.',
    },
  },
});

// Health Check
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Schema Studio AI Backend',
    databaseConnected: isMongoConnected(),
    environment: ENV.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects/generate-direct', aiRateLimiter);
app.use('/api/projects', projectRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/collaborations', requireAuth, InvitationController.listCollaborations);
app.use('/api/contact', contactRoutes);

// Global Error Handler
app.use(errorHandler);

// Server startup
async function startServer() {
  validateEnv();
  await connectMongo();

  app.listen(ENV.PORT, () => {
    console.log(`[Schema Studio AI] Server running on http://localhost:${ENV.PORT}`);
    console.log(`[Schema Studio AI] Model configured: ${ENV.GEMINI_MODEL}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup failure:', err);
  process.exit(1);
});

export default app;
