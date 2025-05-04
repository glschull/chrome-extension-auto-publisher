import { defineConfig } from 'vite';
import { resolve } from 'path';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';
import fs from 'fs';

// Ensure we're using the correct manifest
const finalManifest = JSON.parse(fs.readFileSync('./manifest.json', 'utf-8'));

// Helper function to check if file exists
function fileExists(path) {
  try {
    return fs.statSync(path).isFile();
  } catch (e) {
    return false;
  }
}

// Determine the correct extension for entry files based on what exists
function getEntryPath(basePath, fileName) {
  const tsPath = resolve(__dirname, `${basePath}/${fileName}.ts`);
  const jsPath = resolve(__dirname, `${basePath}/${fileName}.js`);
  
  if (fileExists(tsPath)) {
    return tsPath;
  } else if (fileExists(jsPath)) {
    return jsPath;
  }
  
  // Default to .js if neither exists (will cause a more helpful error)
  return jsPath;
}

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
        background: getEntryPath('src/background', 'index'),
        content: getEntryPath('src/content-script', 'index'),
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