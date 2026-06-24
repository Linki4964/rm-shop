// vite.config.ts
import type { Connect } from 'vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const blockedConfigFiles = new Set([
  '/package.json',
  '/package-lock.json',
  '/vite.config.ts',
  '/vite.config.js',
  '/tsconfig.json',
])

const blockedScannerPaths = new Set([
  '/pma',
  '/pma/',
  '/dbadmin',
  '/dbadmin/',
  '/mysql',
  '/mysql/',
  '/mysqladmin',
  '/mysqladmin/',
  '/phpmyadmin',
  '/phpmyadmin/',
  '/phpMyAdmin',
  '/phpMyAdmin/',
  '/src',
  '/src/',
  '/db',
  '/db/',
  '/@vite',
  '/@vite/',
])

const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
}

const createNotFoundHtml = (requestPath: string) => {
  const redirectTarget = `/404?from=${encodeURIComponent(requestPath)}`

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="refresh" content="0;url=${redirectTarget}" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>404 Not Found</title>
  </head>
  <body>
    <script>
      window.location.replace(${JSON.stringify(redirectTarget)});
    </script>
    <p>Not Found</p>
  </body>
</html>`
}

const blockConfigLeak = () => {
  const middleware: Connect.NextHandleFunction = (req, res, next) => {
    const requestPath = req.url?.split('?')[0]
    const acceptHeader = typeof req.headers.accept === 'string' ? req.headers.accept : ''
    const wantsHtml = acceptHeader.includes('text/html')

    if (requestPath && (blockedConfigFiles.has(requestPath) || blockedScannerPaths.has(requestPath))) {
      res.statusCode = 404
      if (wantsHtml) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.end(createNotFoundHtml(requestPath))
        return
      }

      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.end('Not Found')
      return
    }

    next()
  }

  return {
    name: 'block-config-leak',
    configureServer(server: { middlewares: { use: (handler: Connect.NextHandleFunction) => void } }) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server: { middlewares: { use: (handler: Connect.NextHandleFunction) => void } }) {
      server.middlewares.use(middleware)
    },
  }
}

export default defineConfig({
  plugins: [react(), blockConfigLeak()],
  server: {
    port: 3000,
    headers: securityHeaders,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    },
  },
  preview: {
    headers: securityHeaders,
  },
  optimizeDeps: {
    exclude: ['echarts'],
  },
})
