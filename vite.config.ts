import { defineConfig } from 'vite';
import { resolve } from 'path';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';
import fs from 'fs';

// Ensure we're using the correct manifest
const finalManifest = JSON.parse(fs.readFileSync('./manifest.json', 'utf-8'));

export default defineConfig({
  plugins: [
    crx({ manifest: finalManifest }),
    {
      name: 'copy-manifest',
      writeBundle() {
        fs.copyFileSync('./manifest.json', './dist/manifest.json');
      }
    }
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/background/index.ts'),
        content: resolve(__dirname, 'src/content-script/index.ts'),
        popup: resolve(__dirname, 'src/popup/index.html'),
      },
      output: {
        entryFileNames: chunk => {
          if (chunk.name === 'background') {
            return 'background.js';
          }
          if (chunk.name === 'content') {
            return 'content.js';
          }
          return '[name].js';
        },
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
});