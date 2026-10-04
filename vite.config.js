import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.js',
      formats: ['es'],
      fileName: () => 'conversation-chat-card.js',
    },
    outDir: 'dist',
    emptyOutDir: false,
    minify: false,
    rollupOptions: {
      external: ['/dist/markdown-it.umd.min.js'],
      output: {
        banner: '/* Conversation Chat Card 2.1.0 — Home Assistant dashboard module. MIT. Requires its CSS and markdown-it files in the same directory. */',
        assetFileNames: '[name][extname]',
        paths: {
          '/dist/markdown-it.umd.min.js': './markdown-it.umd.min.js',
        },
      },
    },
  },
});
