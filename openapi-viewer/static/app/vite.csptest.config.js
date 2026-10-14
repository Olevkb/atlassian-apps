import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { noExternalLogo } from './vite.shared.js';
import { fileURLToPath } from 'node:url';

// Production build of the viewer with the fake bridge and a strict CSP, to check that Redoc works in Forge's sandbox.
export default defineConfig({
  plugins: [noExternalLogo(), react()],
  root: fileURLToPath(new URL('./src', import.meta.url)),
  base: './',
  define: { 'process.env.NODE_ENV': '"production"', 'process.env': '{}' },
  resolve: { alias: { '@forge/bridge': fileURLToPath(new URL('./src/dev/bridge-mock.js', import.meta.url)) } },
  build: {
    outDir: fileURLToPath(new URL('./build-csptest', import.meta.url)), emptyOutDir: true, chunkSizeWarningLimit: 4000,
    rollupOptions: { input: fileURLToPath(new URL('./src/dev/csp.html', import.meta.url)) },
  },
});
