import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const KEY = env.VITE_DEEPSEEK_API_KEY || '';
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/llm': {
          target: 'https://api.deepseek.com',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/llm/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (KEY) proxyReq.setHeader('Authorization', `Bearer ${KEY}`);
              proxyReq.setHeader('Origin', 'http://localhost:5173');
            });
          }
        }
      }
    }
  };
});


