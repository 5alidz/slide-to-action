import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  splitting: false,
  clean: true,
  format: ['cjs', 'esm'],
  outDir: 'dist',
  minify: true,
  dts: true,
});
