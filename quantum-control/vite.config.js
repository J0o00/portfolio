import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

export default defineConfig({
  plugins: [react()],
  root: __dirname,
  base: '/',
  build: {
    outDir: resolve(__dirname, '../dist/quantum-control'),
    emptyOutDir: false,
    rollupOptions: {
      input: resolve(__dirname, 'index.html')
    }
  }
});
