import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import { resolve } from 'path';
import manifest from './src/manifest';

console.log('Starting Vite build with manifest:', JSON.stringify(manifest, null, 2));

export default defineConfig({
  build: {
    emptyOutDir: true,
    outDir: 'dist',
    rollupOptions: {
      input: {
        // Use the src/popup/index.html as the entry point for popup
        popup: resolve(__dirname, 'src/popup/index.html'),
        // Add explicit entries for background and content scripts
        background: resolve(__dirname, 'src/background/index.ts'),
        content: resolve(__dirname, 'src/content-script/index.ts')
      },
      output: {
        chunkFileNames: '[name].[hash].js',
        entryFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    }
  },
  plugins: [
    crx({ manifest }),
  ]
});