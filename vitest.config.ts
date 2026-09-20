import react from '@vitejs/plugin-react';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['vitest.setup.ts'],
    // Vite pre-bundles @cognite/aura (and its transitive @tanstack/react-virtual
    // import) by default, which resolves that import before vi.mock's module
    // interception runs. Forcing it through Vitest's own transform pipeline
    // keeps the import live so tests can mock react-virtual (DataGrid's
    // virtualizer, which otherwise renders nothing in happy-dom's zero-layout
    // environment).
    server: {
      deps: {
        inline: ['@cognite/aura'],
      },
    },
    exclude: [...configDefaults.exclude, '.claude/**', '.agents/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '.claude/',
        '.agents/',
        'vitest.setup.ts',
        '**/*.config.ts',
        '**/*.d.ts',
        // Vendored library source (integrate-file-viewer skill) — not
        // authored/maintained by this app, excluded from the coverage gate.
        'src/cognite-file-viewer/**',
      ],
    },
  },
});
