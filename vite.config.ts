import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Maps process.env.API_KEY in the code to the VITE_API_KEY environment variable value
      // This ensures compatibility with the code that uses process.env.API_KEY
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY)
    }
  };
});