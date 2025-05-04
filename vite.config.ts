import { defineConfig } from 'vite';
import { resolve } from 'path';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';
import fs from 'fs';

// Debug logging to help identify issues
console.log('Current working directory:', process.cwd());
console.log('Files in src/content-script:');
try {
  const contentScriptFiles = fs.readdirSync(resolve(process.cwd(), 'src/content-script'));
  console.log(contentScriptFiles);
} catch (err) {
  console.error('Error listing content script files:', err);
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
        
        // Copy content script directly as a fallback
        try {
          if (fs.existsSync('./src/content-script/index.js')) {
            console.log('Copying content script directly');
            fs.copyFileSync('./src/content-script/index.js', './dist/content.js');
          }
        } catch (err) {
          console.error('Error copying content script:', err);
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
        background: resolve(__dirname, 'src/background/index.js'),
        popup: resolve(__dirname, 'src/popup/index.html'),
      },
      output: {
        entryFileNames: chunk => {
          if (chunk.name === 'background') {
            return 'background.js';
          }
          return '[name].js';
        },
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
});