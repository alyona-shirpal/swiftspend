import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Env files live next to this config: .env (production default), .env.local (local override)
  envDir: '.',
});
