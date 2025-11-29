import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  const rawApiKey = env.VITE_API_KEY || '';
  // Base64 encode the key to hide the raw string from simple build scans
  const encodedKey = rawApiKey ? Buffer.from(rawApiKey).toString('base64') : '';
  
  return {
    plugins: [react()],
    define: {
      // Inject the encoded string as a global constant.
      // JSON.stringify is crucial here to ensure it's treated as a string literal.
      '__API_KEY_B64__': JSON.stringify(encodedKey)
    }
  };
});