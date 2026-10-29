import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const repositoryRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: resolve(repositoryRoot, 'frontend'),
  plugins: [react()],
});
