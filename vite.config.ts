import { defineConfig } from 'vite';
import { resolve } from 'path';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';
import fs from 'fs';

// Debug logging to help identify issues
console.log('Current working directory:', process.cwd());
console.log('Files in src directory:');
try {
  const srcFiles = fs.readdirSync(resolve(process.cwd(), 'src'));
  console.log(srcFiles);
  
  console.log('Files in src/popup:');
  const popupFiles = fs.readdirSync(resolve(process.cwd(), 'src/popup'));
  console.log(popupFiles);
} catch (err) {
  console.error('Error listing files:', err);
}

// Ensure we're using the correct manifest
const finalManifest = JSON.parse(fs.readFileSync('./manifest.json', 'utf-8'));

export default defineConfig({
  plugins: [
    crx({ manifest: finalManifest }),
    {
      name: 'copy-files',
      writeBundle() {
        // Copy manifest
        fs.copyFileSync('./manifest.json', './dist/manifest.json');
        
        // Copy popup HTML directly as a fallback
        try {
          if (!fs.existsSync('./dist/popup')) {
            fs.mkdirSync('./dist/popup', { recursive: true });
          }
          
          if (fs.existsSync('./src/popup/index.html') && !fs.existsSync('./dist/popup/index.html')) {
            fs.copyFileSync('./src/popup/index.html', './dist/popup/index.html');
            console.log('Successfully copied popup HTML from src');
          }
        } catch (err) {
          console.error('Error copying popup HTML:', err);
        }
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
    sourcemap: true,
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'background.js'),
        content: resolve(__dirname, 'content.js'),
        popup: resolve(__dirname, 'popup.html')
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