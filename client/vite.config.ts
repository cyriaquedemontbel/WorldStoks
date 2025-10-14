import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    root: process.cwd(),
    server: {
  // Allow Vite to pick a free port automatically to avoid port-in-use errors in the dev environment.
  // Setting port to 0 asks the OS to choose an available ephemeral port.
  port: 0,
      host: 'localhost',
      // Fail if port is in use instead of automatically selecting another port.
      // This prevents the browser from loading an unexpected port (e.g. 3001)
      // while the user keeps visiting http://localhost:3000 and getting 404s for
      // module requests like /api.ts.
      strictPort: true,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
        '/auth': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
        '/orders': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
        '/stocks': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
        '/trades': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
        '/user': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), 'src'),
      },
    },
  };
});
