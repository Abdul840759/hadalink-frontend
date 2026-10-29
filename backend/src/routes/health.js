import { Router } from 'express';
import { getDatabaseStatus } from '../config/database.js';

const router = Router();

router.get('/', (_request, response) => {
  const database = getDatabaseStatus();
  const status = database === 'connected' ? 'ok' : 'degraded';
  response.status(status === 'ok' ? 200 : 503).json({ status, service: 'hadalink-api', database });
});

export default router;
