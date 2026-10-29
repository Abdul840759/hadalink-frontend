import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import authRouter from './routes/auth.js';
import equipmentRouter from './routes/equipment.js';
import healthRouter from './routes/health.js';

const app = express();
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

app.use((_request, response) => {
  response.status(404).json({ error: 'Route not found' });
});

app.use((error, _request, response, _next) => {
  console.error(error.name || 'Error', error.status || 500);
  if (error.name === 'ValidationError' || error.name === 'CastError' || error.type === 'entity.parse.failed') {
    return response.status(400).json({ error: 'The request contains invalid data.' });
  }
  if (error.code === 11000) return response.status(409).json({ error: 'A record with those details already exists.' });
  if (error.message === 'This origin is not allowed by the API.') {
    return response.status(403).json({ error: 'This origin is not allowed by the API.' });
  }
  return response.status(error.status || 500).json({ error: error.status && error.status < 500 ? error.message : 'An unexpected server error occurred' });
});

export default app;
