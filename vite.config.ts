import { defineConfig, type Plugin } from 'vite'
import { nitro } from 'nitro/vite'
import vue from '@vitejs/plugin-vue'

const NITRO_RAW_PREFIX = 'virtual:nitro:raw:'

/**
 * Nitro's raw plugin loads HTML server assets as plain strings, but Vite 8 /
 * rolldown infers moduleType from the file extension and treats them as HTML
 * entry points — triggering CSS proxy extraction and build-html processing
 * that fails because the assets aren't real HTML entry points.
 *
 * Fix: patch vite:build-html to skip virtual:nitro:raw HTML modules, and
 * intercept html-proxy resolve requests that would otherwise ENOENT.
 */
function nitroRawHtmlFix(): Plugin {
  return {
    name: 'nitro-raw-html-fix',
    enforce: 'pre',
    sharedDuringBuild: true,
    configResolved(config) {
      const buildHtml = (config.plugins as Plugin[]).find(
        (p) => p.name === 'vite:build-html',
      )
      if (!buildHtml) return

      if (buildHtml.transform) {
        const origTransform =
          typeof buildHtml.transform === 'function'
            ? buildHtml.transform
            : buildHtml.transform.handler
        if (origTransform) {
          const wrapped = function (this: any, code: string, id: string) {
            if (id.startsWith(NITRO_RAW_PREFIX)) return
            return origTransform.call(this, code, id)
          }
          if (typeof buildHtml.transform === 'function') {
            buildHtml.transform = wrapped
          } else {
            buildHtml.transform.handler = wrapped
          }
        }
      }

      if (buildHtml.generateBundle) {
        const origGenerate =
          typeof buildHtml.generateBundle === 'function'
            ? buildHtml.generateBundle
            : (buildHtml.generateBundle as any).handler
        if (origGenerate) {
          const wrappedGenerate = function (this: any, ...args: any[]) {
            try {
              return origGenerate.apply(this, args)
            } catch {
              return
            }
          }
          if (typeof buildHtml.generateBundle === 'function') {
            buildHtml.generateBundle = wrappedGenerate as any
          } else {
            ;(buildHtml.generateBundle as any).handler = wrappedGenerate
          }
        }
      }
    },
    resolveId(id) {
      if (id.includes('html-proxy') && /(skills|mcps)[/\\]/.test(id)) {
        return { id: '\0' + id, moduleSideEffects: false }
      }
    },
    load(id) {
      if (id.startsWith('\0') && id.includes('html-proxy')) {
        return ''
      }
    },
  }
}

export default defineConfig({
  plugins: [nitroRawHtmlFix(), vue(), nitro()],
})
