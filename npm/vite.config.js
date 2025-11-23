import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  esbuild: {
    loader: 'ts',
    include: /src\/.*\.[tj]sx?$/,
  },
  build: {
    lib: {
      entry: 'index.ts',
      name: 'Me',
      fileName: (format) => `me.${format}.js`,
      formats: ['es', 'cjs', 'umd'],
    },
    rollupOptions: {
      output: {
        globals: {
          // Example: 'vue': 'Vue'
        },
      },
    },
  },
});