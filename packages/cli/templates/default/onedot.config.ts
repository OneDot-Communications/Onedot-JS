import { defineConfig } from '@onedot/bundler';

export default defineConfig({
  root: './src',
  entryPoint: './src/main.ts',
  outDir: './dist',
  plugins: [],
  server: {
    port: 3000,
    host: 'localhost',
    hmr: true
  },
  build: {
    target: 'es2022',
    minify: true,
    sourcemap: true
  },
  routing: {
    type: 'file-based',
    pagesDir: './src/pages'
  },
  css: {
    preprocessor: 'none',
    modules: false
  }
});
