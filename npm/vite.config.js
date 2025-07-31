import { defineConfig } from 'vite';

// Opcional: si usas JSX, TypeScript o compatibilidad con Node
// importa plugins aquí

export default defineConfig({
  build: {
    lib: {
      entry: 'src/browser/me.browser.js',
      name: 'Me',
      fileName: (format) => `this-me.${format}.js`,
      formats: ['es', 'cjs', 'umd'],
    },
    rollupOptions: {
      // external: ['dependencias externas'],
      output: {
        globals: {
          // Ejemplo: 'vue': 'Vue'
        }
      }
    }
  }
});