import 'dotenv/config';
import app from './app.js';
import { connectDatabase } from './config/database.js';

const port = Number(process.env.PORT) || 4000;

try {
  await connectDatabase();
  app.listen(port, () => {
    console.log(`HadaLink API listening on http://localhost:${port}`);
  });
} catch (error) {
  console.error('Could not connect to MongoDB:', error.message);
  process.exitCode = 1;
}
