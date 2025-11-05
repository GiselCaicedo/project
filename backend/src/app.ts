import express from 'express'
import helmet from 'helmet'
import xss from 'xss-clean'
import hpp from 'hpp'
import rateLimit from 'express-rate-limit'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'node:path'
import { existsSync, mkdirSync } from 'node:fs'
import { errorHandler } from './middlewares/errorHandler.js'
import indexRoutes from './routes/index.js'
import { swaggerSpec, swaggerUi } from './config/swagger.js'

const app = express()

app.use(express.json({ limit: '25mb' }))
app.use(cookieParser())

// Seguridad 

app.use(helmet()) // Para proteger cabeceras HTTP
// Para proteger contra ataques XSS, se implemento /services/sanitize.ts
app.use(hpp()) // Para proteger contra ataques de inyección HTTP Parameter Pollution

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100
})

app.use(limiter)

// CORS
// Permitimos orígenes configurables por env y algunos por defecto en local
const defaultOrigins = new Set([
  'http://localhost:3000',
  'http://127.0.0.1:3000',
])

const envOriginsRaw = process.env.CORS_ORIGIN || ''
const envOrigins = envOriginsRaw
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

for (const o of envOrigins) defaultOrigins.add(o)

const corsOptions = {
  origin: (origin, callback) => {
    // Requests sin header Origin (por ejemplo, SSR o herramientas locales)
    if (!origin) return callback(null, true)
    if (defaultOrigins.has(origin)) return callback(null, true)
    return callback(new Error(`CORS: origen no permitido -> ${origin}`))
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}

app.use(cors(corsOptions))
// Manejar preflight para cualquier ruta en Express 5 (path-to-regexp v6)
app.options(/.*/, cors(corsOptions))

// Logging básico de requests/responses
app.use((req, res, next) => {
  const start = Date.now()
  const hasAuth = Boolean(req.headers.authorization)
  const hasCookie = Boolean((req as any).cookies?.auth_token)
  console.log(`[REQ] ${req.method} ${req.originalUrl} | Origin=${req.headers.origin ?? '-'} | Auth=${hasAuth ? 'yes' : 'no'} | Cookie=${hasCookie ? 'yes' : 'no'}`)
  res.on('finish', () => {
    const ms = Date.now() - start
    console.log(`[RES] ${res.statusCode} ${req.method} ${req.originalUrl} (${ms}ms)`) 
  })
  next()
})

const uploadsDir = path.resolve('uploads')
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true })
}

app.use('/uploads', express.static(uploadsDir))

app.use('/', indexRoutes)

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// connectDB().then(() => {
//   app.listen(3000, () => {
//     console.log('Servidor http://localhost:3000')
//   })
// })


app.use(errorHandler)

export { app }
