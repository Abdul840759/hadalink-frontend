import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import authRouter from './routes/auth.js';
import equipmentRouter from './routes/equipment.js';
import bookingsRouter from './routes/bookings.js';
import healthRouter from './routes/health.js';
import transportRouter from './routes/transport.js';

const app = express();
// Render terminates TLS and forwards requests through one trusted proxy.
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  credentials: true,
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('This origin is not allowed by the API.'));
  },
}));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.get('/api', (_request, response) => {
  response.json({ name: 'HadaLink API', status: 'running' });
});

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/equipment', equipmentRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/transport', transportRouter);

app.use((_request, response) => {
  response.status(404).json({ error: 'Route not found' });
});

app.use((error, request, response, _next) => {
  const disallowedOrigin = error.message === 'This origin is not allowed by the API.';
  const status = disallowedOrigin ? 403 : error.status || 500;
  console.error(`[api] ${request.method} ${request.path} -> ${status}: ${error.message || error.name || 'Unknown error'}`);
  if (status >= 500 && error.stack) console.error(error.stack);
  if (error.name === 'ValidationError' || error.name === 'CastError' || error.type === 'entity.parse.failed') {
    return response.status(400).json({ error: 'The request contains invalid data.' });
  }
  if (error.code === 11000) return response.status(409).json({ error: 'A record with those details already exists.' });
  if (disallowedOrigin) {
    return response.status(403).json({ error: 'This origin is not allowed by the API.' });
  }
  return response.status(error.status || 500).json({ error: error.status && error.status < 500 ? error.message : 'An unexpected server error occurred' });
});

export default app;
