import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

function stripInvalidWeixinShareFields() {
  return {
    name: 'strip-invalid-weixin-share-fields',
    closeBundle() {
      if ((process.env.UNI_PLATFORM ?? '') !== 'mp-weixin') return

      const outDir = path.resolve(__dirname, `dist/${process.env.UNI_PLATFORM ?? 'h5'}`)
      const pagesDir = path.join(outDir, 'pages')
      if (!fs.existsSync(pagesDir)) return

      const pageNames = fs.readdirSync(pagesDir, { withFileTypes: true }).filter((entry) => entry.isDirectory())
      for (const pageDir of pageNames) {
        const jsonPath = path.join(pagesDir, pageDir.name, 'index.json')
        if (!fs.existsSync(jsonPath)) continue

        const raw = fs.readFileSync(jsonPath, 'utf8')
        const parsed = JSON.parse(raw) as Record<string, unknown>
        let changed = false

        if ('enableShareAppMessage' in parsed) {
          delete parsed.enableShareAppMessage
          changed = true
        }
        if ('enableShareTimeline' in parsed) {
          delete parsed.enableShareTimeline
          changed = true
        }

        if (changed) {
          fs.writeFileSync(jsonPath, `${JSON.stringify(parsed, null, 2)}\n`)
        }
      }
    },
  }
}

export default defineConfig({
  // @dcloudio/vite-plugin-uni is published as CJS; ESM import yields a namespace object.
  // Use its default export as the actual Vite plugin factory.
  plugins: [((uni as any).default ?? uni)(), stripInvalidWeixinShareFields()],
  build: {
    outDir: `dist/${process.env.UNI_PLATFORM ?? 'h5'}`,
    emptyOutDir: true,
  },
})
