import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

// Fix for __dirname in ESM environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(() => {
    return {
      // Polyfill: some dependencies (like @google/genai) check `process.env`
      // internally, which doesn't exist in a real browser. Replacing it with
      // an empty object here prevents a "process is not defined" crash.
      define: {
        'process.env': '{}',
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      optimizeDeps: {
        entries: [
          'index.html',
          'index.tsx',
          'App.tsx',
          'components/**/*.tsx',
          'utils/**/*.ts',
          'services/geminiService.ts'
        ],
        include: ['@google/genai']
      }
    };
});