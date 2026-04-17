import 'dotenv/config'
import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import cors from 'cors'
import mongoose from 'mongoose'
import { createServer } from 'http'
import { Server } from 'socket.io'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import chatRoutes from './routes/chat.js'
import videoRoutes from './routes/video.js'
import queryRoutes from './routes/queries.js'
import notificationRoutes from './routes/notifications.js'
import Visit from './models/Visit.js'
import jwt from 'jsonwebtoken'

const app = express()

// Ensure upload directories exist
const uploadDirs = ['uploads', 'uploads/documents', 'uploads/avatars'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

// ─── STABLE CORS CONFIGURATION ───
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  next();
});

// ─── ANALYTICS MIDDLEWARE (Real-World Hit Tracking) ───
app.use(async (req, res, next) => {
  // Only track API hits or general entry, ignore static assets/noisy paths
  const ignoredPaths = ['/uploads', '/api/health', '/favicon.ico'];
  if (ignoredPaths.some(p => req.path.startsWith(p))) return next();

  try {
    const visit = new Visit({
      ip: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent'],
      path: req.path,
      referrer: req.headers['referer'] || req.headers['referrer'],
      deviceType: req.headers['sec-ch-ua-mobile'] === '?1' ? 'Mobile' : 'Desktop'
    });
    await visit.save();
  } catch (err) {
    console.warn('⚠️ Analytics tracking failed:', err.message);
  }
  next();
});

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all for debugging, or use process.env.FRONTEND_URL list
    methods: ["GET", "POST"],
    credentials: true,
  },
  allowEIO3: true // Support older clients if needed
})
app.set('io', io)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = process.env.PORT || 5000
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chat-app'

// Note: Manual CORS is handled at the very top of this file
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// MongoDB Connection
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected')
    mongoose.set('bufferCommands', true) // Enable buffering once connected
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message)
    console.log('⚠️  Please ensure MongoDB is running (e.g., run `mongod` or start the service)')
    console.log('⚠️  Operations requiring a database will fail immediately instead of hanging.')
    
    // Disable buffering so that API calls fail immediately instead of timeout
    mongoose.set('bufferCommands', false)
  })

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/video', videoRoutes)
app.use('/api/queries', queryRoutes)
app.use('/api/notifications', notificationRoutes)

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

// Socket.io Logic
const onlineUsers = new Map() // userId -> socketId

// Authentication Middleware for Socket.io
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  console.log('🔍 Socket Auth Check - Token present:', !!token);

  if (!token) {
    console.warn('❌ Socket Auth Failed: No token provided');
    return next(new Error('Authentication error: No token provided'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    socket.userId = decoded.id;
    socket.userEmail = decoded.email;
    console.log('✅ Socket Auth Success - User:', socket.userId);
    next();
  } catch (err) {
    console.error('❌ Socket Auth Failed:', err.message);
    next(new Error('Authentication error: Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id, 'User:', socket.userId)

  socket.on('join', (userId) => {
    console.log(`📡 [Socket] Join Request - Client userId: ${userId}, Socket userId: ${socket.userId}`);
    // Verify that the user is joining their own room
    if (userId !== socket.userId) {
      console.warn(`⚠️ User ${socket.userId} tried to join room of ${userId}`);
      return;
    }
    socket.join(userId)
    onlineUsers.set(userId, socket.id)
    io.emit('user-status', { userId, status: 'online' })
    console.log(`👤 User ${userId} joined their personal room`)
  })

  socket.on('join-chat', (conversationId) => {
    socket.join(conversationId)
    console.log(`💬 [Socket] User ${socket.userId} joined chat room: ${conversationId}`)
  })

  socket.on('typing', ({ conversationId, userId, userName }) => {
    console.log(`⌨️ [Socket] Typing: ${userName} in ${conversationId}`);
    socket.to(conversationId).emit('typing', { conversationId, userId, userName })
  })

  socket.on('stop-typing', ({ conversationId, userId }) => {
    console.log(`⏹️ [Socket] Stop Typing: ${userId} in ${conversationId}`);
    socket.to(conversationId).emit('stop-typing', { conversationId, userId })
  })

  socket.on('send-message', (message) => {
    console.log(`✉️ [Socket] New Message emitted to room ${message.conversationId}`);
    // message.conversationId should be available
    io.to(message.conversationId).emit('new-message', message)
  })

  socket.on('start-call', ({ conversationId, userId, userName, userAvatar, participants }) => {
    if (participants && Array.isArray(participants)) {
      participants.forEach(pId => {
        if (pId !== userId) {
          io.to(pId).emit('incoming-call', { conversationId, userId, userName, userAvatar, participants })
        }
      })
    }
    console.log(`📞 Call started in ${conversationId} by ${userName} (Participants: ${participants?.length})`)
  })

  socket.on('accept-call', ({ conversationId, userId, participants }) => {
    if (participants && Array.isArray(participants)) {
      participants.forEach(pId => {
        if (pId !== userId) {
          io.to(pId).emit('call-accepted', { conversationId, userId, participants })
        }
      })
    }
    console.log(`✅ Call accepted in ${conversationId} by ${userId}`)
  })

  socket.on('reject-call', ({ conversationId, userId, participants }) => {
    if (participants && Array.isArray(participants)) {
      participants.forEach(pId => {
        if (pId !== userId) {
          io.to(pId).emit('call-rejected', { conversationId, userId, participants })
        }
      })
    }
    console.log(`❌ Call rejected in ${conversationId} by ${userId}`)
  })

  socket.on('disconnect', () => {
    let disconnectedUserId = null
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        disconnectedUserId = userId
        onlineUsers.delete(userId)
        break
      }
    }
    if (disconnectedUserId) {
      io.emit('user-status', { userId: disconnectedUserId, status: 'offline' })
      console.log(`👋 User ${disconnectedUserId} went offline`)
    }
  })
})

httpServer.listen(PORT, () => {
  console.log(`\n✅ Server running on port ${PORT}`)
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`)
  
  const dbUri = process.env.MONGODB_URI || ''
  const maskedUri = dbUri.replace(/\/\/.*@/, '//****:****@')
  console.log(`🔗 MongoDB URI: ${maskedUri ? maskedUri : 'MISSING'}`)
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'NOT SET'}\n`)
})

export default app
