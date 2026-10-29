import cors from 'cors';
import express from 'express';
import healthRouter from './routes/health.js';

const app = express();
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: frontendOrigin }));
app.use(express.json({ limit: '1mb' }));

app.get('/api', (_request, response) => {
  response.json({ name: 'HadaLink API', status: 'running' });
});

app.use('/api/health', healthRouter);

app.use((_request, response) => {
  response.status(404).json({ error: 'Route not found' });
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: 'An unexpected server error occurred' });
});

export default app;
