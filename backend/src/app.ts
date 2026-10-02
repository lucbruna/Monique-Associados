import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import clientRoutes from './routes/client.routes';
import caseRoutes from './routes/case.routes';
import deadlineRoutes from './routes/deadline.routes';
import hearingRoutes from './routes/hearing.routes';
import documentRoutes from './routes/document.routes';
import appointmentRoutes from './routes/appointment.routes';
import feeRoutes from './routes/fee.routes';
import contractRoutes from './routes/contract.routes';
import dashboardRoutes from './routes/dashboard.routes';
import notificationRoutes from './routes/notification.routes';
import templateRoutes from './routes/template.routes';
import auditRoutes from './routes/audit.routes';
import installmentRoutes from './routes/installment.routes';
import expenseRoutes from './routes/expense.routes';
import repasseRoutes from './routes/repasse.routes';
import financeRoutes from './routes/finance.routes';

dotenv.config();

const app: Application = express();

// Security middleware
// This server only exposes JSON APIs and static uploads — it never serves HTML
// documents — so helmet's document CSP has nothing to protect. Left enabled, it
// is sent on every response and leaks into any tab opened through the dev proxy,
// where it becomes the only enforceable CSP and blocks script evaluation
// (DevTools: "Content Security Policy ... blocks the use of eval").
app.use(helmet({ contentSecurityPolicy: false }));
// Allowed origins: CORS_ORIGIN holds a comma-separated list (dev + staging +
// production), e.g. "http://localhost:3000,https://app.example.com.br".
// Falls back to the Vite dev server when the variable is not set.
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: corsOrigins,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Muitas requisições deste IP, tente novamente mais tarde.'
});
app.use('/api/', limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files with CORS + CORP headers for profile images and uploads.
// Cross-origin resource loading is only needed here, not on API routes.
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  const requestOrigin = req.headers.origin;
  if (requestOrigin && corsOrigins.includes(requestOrigin)) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
}, express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/deadlines', deadlineRoutes);
app.use('/api/hearings', hearingRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/installments', installmentRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/repasses', repasseRoutes);
app.use('/api/finance', financeRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: '⚖️ Monique Advogados API',
    version: '1.0.0',
    status: 'running'
  });
});

// Error handler
app.use(errorHandler);

export default app;
