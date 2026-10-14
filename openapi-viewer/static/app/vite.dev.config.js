import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { noExternalLogo } from './vite.shared.js';
import { fileURLToPath } from 'node:url';

// Local development only: @forge/bridge is replaced by a fake Confluence page with sample attachments.
export default defineConfig({
  plugins: [noExternalLogo(), react()],
  root: fileURLToPath(new URL('./src', import.meta.url)),
  define: { 'process.env.NODE_ENV': '"development"', 'process.env': '{}' },
  resolve: { alias: { '@forge/bridge': fileURLToPath(new URL('./src/dev/bridge-mock.js', import.meta.url)) } },
  server: { port: 5178, open: false },
});
