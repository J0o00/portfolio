import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Custom plugin to ensure Vite dev server routes /quantum-control/* to the correct index.html
const adminRewritePlugin = () => {
  return {
    name: 'admin-rewrite',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const urlWithoutQuery = req.url.split('?')[0];
        // If the URL starts with /quantum-control and doesn't look like a static asset request
        if (urlWithoutQuery.startsWith('/quantum-control') && !urlWithoutQuery.match(/\.[a-zA-Z0-9]+$/)) {
          req.url = '/quantum-control/index.html';
        }
        next();
      });
    }
  };
};

export default defineConfig({
  plugins: [react(), adminRewritePlugin()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'quantum-control/index.html')
      }
    }
  }
});
