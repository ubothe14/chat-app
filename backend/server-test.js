import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5002

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177', 'http://localhost:5178', 'http://localhost:5179'],
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))

// Test route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date(),
    message: 'Server is running without MongoDB'
  })
})

// Signup test route
app.post('/api/auth/signup', (req, res) => {
  console.log('Signup request received:', req.body)
  res.json({
    message: 'Signup endpoint working',
    user: { id: 'test', name: req.body.name, email: req.body.email },
    token: 'test-token'
  })
})

app.listen(PORT, () => {
  console.log(`✅ Test server running on http://localhost:${PORT}`)
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`)
})