import mongoose from 'mongoose';

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('MONGODB_URI is not set; database-backed API routes are unavailable.');
    return false;
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
  });
  console.log(`MongoDB connected (${mongoose.connection.name}).`);
  return true;
}

export function getDatabaseStatus() {
  return mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
}

export { mongoose };
