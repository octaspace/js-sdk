import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2020',
  minify: false,
  splitting: false,
  treeshake: true,
  tsconfig: './tsconfig.build.json',
  external: ['@octaspace/sdk', 'react', 'react/jsx-runtime'],
})
