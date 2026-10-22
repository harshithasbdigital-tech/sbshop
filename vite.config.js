import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import fs from 'node:fs'
import path from 'node:path'

// Mock API handler for /api/parts.php and /api/upload.php during Vite development
function partsApiPlugin() {
  const partsFilePath = path.resolve(__dirname, 'public/api/parts.json')
  const uploadsDirPath = path.resolve(__dirname, 'public/api/uploads')

  // Helper to save base64 to file
  const saveBase64ToFile = (base64Data) => {
    if (!base64Data || typeof base64Data !== 'string') return ''
    const match = base64Data.match(/^data:image\/(\w+);base64,/)
    if (match) {
      let ext = match[1].toLowerCase()
      if (ext === 'jpeg') ext = 'jpg'
      const base64Str = base64Data.replace(/^data:image\/\w+;base64,/, '')
      const buffer = Buffer.from(base64Str, 'base64')
      const fileName = `part_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
      fs.mkdirSync(uploadsDirPath, { recursive: true })
      fs.writeFileSync(path.resolve(uploadsDirPath, fileName), buffer)
      return `/api/uploads/${fileName}`
    }
    return base64Data
  }

  return {
    name: 'parts-api-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || ''

        // ─────────────────────────────────────────────────────────
        // /api/upload.php handler
        // ─────────────────────────────────────────────────────────
        if (url.startsWith('/api/upload.php')) {
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

          if (req.method === 'OPTIONS') {
            res.statusCode = 200
            res.end()
            return
          }

          if (req.method === 'POST') {
            const chunks = []
            req.on('data', chunk => chunks.push(chunk))
            req.on('end', () => {
              const buffer = Buffer.concat(chunks)
              const contentType = req.headers['content-type'] || ''

              fs.mkdirSync(uploadsDirPath, { recursive: true })

              // If JSON with base64
              if (contentType.includes('application/json')) {
                try {
                  const body = JSON.parse(buffer.toString('utf-8'))
                  const savedUrl = saveBase64ToFile(body.image || body.data)
                  if (savedUrl && savedUrl.startsWith('/api/uploads/')) {
                    const fileName = path.basename(savedUrl)
                    res.setHeader('Content-Type', 'application/json; charset=utf-8')
                    res.statusCode = 200
                    res.end(JSON.stringify({ success: true, url: savedUrl, fileName }))
                    return
                  }
                } catch {}
              }

              // If Multipart Form Data
              if (contentType.includes('multipart/form-data')) {
                const boundary = contentType.split('boundary=')[1]
                if (boundary) {
                  const boundaryBuffer = Buffer.from(`--${boundary}`)
                  const rawString = buffer.toString('binary')
                  const parts = rawString.split(`--${boundary}`)

                  for (const part of parts) {
                    if (part.includes('Content-Disposition') && part.includes('filename="')) {
                      const filenameMatch = part.match(/filename="([^"]+)"/)
                      const origFilename = filenameMatch ? filenameMatch[1] : 'uploaded.png'
                      let ext = path.extname(origFilename).replace('.', '').toLowerCase() || 'png'
                      if (ext === 'jpeg') ext = 'jpg'

                      const headerEndIndex = part.indexOf('\r\n\r\n')
                      if (headerEndIndex !== -1) {
                        let fileData = part.slice(headerEndIndex + 4)
                        if (fileData.endsWith('\r\n')) {
                          fileData = fileData.slice(0, -2)
                        }
                        const fileBuffer = Buffer.from(fileData, 'binary')
                        const newFileName = `part_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
                        fs.writeFileSync(path.resolve(uploadsDirPath, newFileName), fileBuffer)

                        res.setHeader('Content-Type', 'application/json; charset=utf-8')
                        res.statusCode = 200
                        res.end(JSON.stringify({
                          success: true,
                          url: `/api/uploads/${newFileName}`,
                          fileName: newFileName,
                          message: 'Image successfully saved to uploads folder.'
                        }))
                        return
                      }
                    }
                  }
                }
              }

              res.statusCode = 400
              res.end(JSON.stringify({ success: false, error: 'Could not parse uploaded file' }))
            })
            return
          }
        }

        // ─────────────────────────────────────────────────────────
        // /api/parts.php handler
        // ─────────────────────────────────────────────────────────
        if (url.startsWith('/api/parts.php')) {
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

          if (req.method === 'OPTIONS') {
            res.statusCode = 200
            res.end()
            return
          }

          if (req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            try {
              if (fs.existsSync(partsFilePath)) {
                const data = fs.readFileSync(partsFilePath, 'utf-8')
                res.end(data || '[]')
                return
              }
            } catch (err) {
              console.error('Error reading parts.json:', err)
            }
            res.end('[]')
            return
          }

          if (req.method === 'DELETE') {
            const urlObj = new URL(req.url, 'http://localhost')
            const clearAll = urlObj.searchParams.get('clear_all') === 'true'
            const id = urlObj.searchParams.get('id')
            const code = urlObj.searchParams.get('code')

            let parts = []
            if (fs.existsSync(partsFilePath)) {
              try {
                parts = JSON.parse(fs.readFileSync(partsFilePath, 'utf-8'))
                if (!Array.isArray(parts)) parts = []
              } catch {
                parts = []
              }
            }

            if (clearAll) {
              parts = []
            } else if (id || code) {
              parts = parts.filter(p => p.id !== id && p.code !== code && p.code !== id && p.id !== code)
            }

            fs.mkdirSync(path.dirname(partsFilePath), { recursive: true })
            fs.writeFileSync(partsFilePath, JSON.stringify(parts, null, 2), 'utf-8')

            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.statusCode = 200
            res.end(JSON.stringify({ success: true, message: clearAll ? 'All parts cleared.' : 'Part deleted.' }))
            return
          }

          if (req.method === 'POST') {
            let body = ''
            req.on('data', chunk => {
              body += chunk
            })
            req.on('end', () => {
              try {
                const parsedBody = JSON.parse(body)
                let parts = []
                if (fs.existsSync(partsFilePath)) {
                  try {
                    const parsed = JSON.parse(fs.readFileSync(partsFilePath, 'utf-8'))
                    parts = Array.isArray(parsed) ? parsed : (parsed.data || [])
                  } catch {
                    parts = []
                  }
                }

                // Handle Bulk
                if (parsedBody && Array.isArray(parsedBody.bulk)) {
                  const bulkProcessed = parsedBody.bulk.map(item => ({
                    ...item,
                    image: saveBase64ToFile(item.image),
                    id: item.id || item.code || `SB-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    created_at: new Date().toISOString()
                  }))

                  parts = [...bulkProcessed, ...parts]
                  fs.mkdirSync(path.dirname(partsFilePath), { recursive: true })
                  fs.writeFileSync(partsFilePath, JSON.stringify(parts, null, 2), 'utf-8')

                  res.setHeader('Content-Type', 'application/json; charset=utf-8')
                  res.statusCode = 200
                  res.end(JSON.stringify({
                    success: true,
                    count: bulkProcessed.length,
                    message: `Bulk uploaded ${bulkProcessed.length} parts.`
                  }))
                  return
                }

                // Single Part
                const newPart = parsedBody
                newPart.image = saveBase64ToFile(newPart.image)
                newPart.id = newPart.id || newPart.code || `SB-${Date.now()}`
                newPart.created_at = new Date().toISOString()

                parts = parts.filter(p => p.id !== newPart.id && p.code !== newPart.code)
                parts.unshift(newPart)

                // Ensure directory exists
                fs.mkdirSync(path.dirname(partsFilePath), { recursive: true })
                fs.writeFileSync(partsFilePath, JSON.stringify(parts, null, 2), 'utf-8')

                res.setHeader('Content-Type', 'application/json; charset=utf-8')
                res.statusCode = 200
                res.end(JSON.stringify({
                  success: true,
                  message: 'Part uploaded successfully to central catalog',
                  part: newPart
                }))
              } catch (e) {
                res.statusCode = 400
                res.end(JSON.stringify({ success: false, error: 'Invalid JSON payload' }))
              }
            })
            return
          }
        }
        next()
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), partsApiPlugin()],
  server: {
    port: 5173,
    host: true
  }
})
