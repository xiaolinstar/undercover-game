import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

export default defineConfig({
  // @dcloudio/vite-plugin-uni is published as CJS; ESM import yields a namespace object.
  // Use its default export as the actual Vite plugin factory.
  plugins: [((uni as any).default ?? uni)()],
  build: {
    outDir: `dist/${process.env.UNI_PLATFORM ?? 'h5'}`,
    emptyOutDir: true,
  },
})
