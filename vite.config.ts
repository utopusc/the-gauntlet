import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// AI Studio pattern: expose the Gemini key as BOTH process.env.API_KEY and
// process.env.GEMINI_API_KEY so the app runs locally AND inside AI Studio
// (which injects the key into process.env.API_KEY at runtime).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
  };
});
