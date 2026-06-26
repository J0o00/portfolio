import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.resolve(__dirname, '../dist/assets');
const targetDir = path.resolve(__dirname, '../dist/quantum-control/assets');

console.log('[Copy Admin Assets] Synchronizing compiled asset chunks for standalone Vercel deployment...');

if (fs.existsSync(sourceDir)) {
  fs.cpSync(sourceDir, targetDir, { recursive: true });
  console.log('[Copy Admin Assets] Successfully duplicated assets into dist/quantum-control/assets');
} else {
  console.error('[Copy Admin Assets] Source directory dist/assets not found!');
  process.exit(1);
}
