import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { noExternalLogo } from './vite.shared.js';

// The macro view. Relative paths (base './') because Forge serves the bundle from its own location.
export default defineConfig({
  plugins: [noExternalLogo(), react()],
  root: 'src/viewer',
  base: './',
  define: { 'process.env.NODE_ENV': '"production"', 'process.env': '{}' },
  build: { outDir: '../../build/viewer', emptyOutDir: true, chunkSizeWarningLimit: 4000 },
});
