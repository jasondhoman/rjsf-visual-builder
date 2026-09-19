import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Builds the publishable `@mestuka/rjsf-visual-builder` package from `src/lib`.
 * Run with `pnpm run build:lib` (or `pnpm run build`, which is an alias for
 * it). The demo app in `src/demo` is built separately via
 * `pnpm run build:demo` and is never included in the published package.
 */
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    dts({
      tsconfigPath: './tsconfig.lib.json',
      entryRoot: 'src/lib',
      include: ['src/lib'],
      insertTypesEntry: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
    },
  },
  publicDir: false,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    lib: {
      entry: path.resolve(dirname, './src/lib/index.ts'),
      name: 'RjsfVisualBuilder',
      fileName: (format) => (format === 'es' ? 'index.js' : `index.${format}.js`),
      formats: ['es', 'cjs'],
      cssFileName: 'style',
    },
    rollupOptions: {
      external: [
        'react',
        'react/jsx-runtime',
        'react-dom',
        '@rjsf/core',
        '@rjsf/utils',
        '@rjsf/validator-ajv8',
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
})
