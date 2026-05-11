import { defineConfig } from 'vitest/config'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import viteReact from '@vitejs/plugin-react'

/**
 * Isolated test config — does NOT load Next.js / fumadocs / mdx plugins,
 * which crash under jsdom because they expect a server runtime. Tests cover
 * the shaduler component itself; everything else is exercised via the dev
 * server / type-check.
 */
export default defineConfig({
  plugins: [
    viteTsConfigPaths({ projects: ['./tsconfig.json'] }),
    viteReact(),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test-setup.ts'],
    include: ['components/**/__tests__/**/*.{test,spec}.{ts,tsx}'],
  },
})
