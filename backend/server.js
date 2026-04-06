import 'dotenv/config'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import cors from 'cors'
import mongoose from 'mongoose'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import chatRoutes from './routes/chat.js'
const app = express()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = process.env.PORT || 5000
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chat-app'

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
]

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`CORS origin not allowed: ${origin}`))
    }
  },
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// MongoDB Connection
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message)
    console.log('⚠️  Continuing without MongoDB - using in-memory storage')
    // Don't exit, continue with limited functionality
  })

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/chat', chatRoutes)

// Home route
app.get('/', (req, res) => {
  res.json({
    message: 'Chat App API',
    version: '1.0.0',
    status: 'active',
    routes: {
      auth: '/api/auth',
      users: '/api/users',
      chat: '/api/chat'
    }
  })
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    mongoDb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.path })
})

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err)
  const status = err.status || 500
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error'
    : err.message
  
  res.status(status).json({ 
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

app.listen(PORT, () => {
  console.log(`\n✅ Server running on http://localhost:${PORT}`)
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔗 MongoDB: ${MONGODB_URI}\n`)
})
