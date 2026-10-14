import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The macro configuration screen.
export default defineConfig({
  plugins: [react()],
  root: 'src/config',
  base: './',
  define: { 'process.env.NODE_ENV': '"production"', 'process.env': '{}' },
  build: { outDir: '../../build/config', emptyOutDir: true, chunkSizeWarningLimit: 4000 },
});
