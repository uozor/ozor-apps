import { defineConfig } from 'vitest/config';

export default defineConfig({
  server: { fs: { strict: false } },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
  },
});
