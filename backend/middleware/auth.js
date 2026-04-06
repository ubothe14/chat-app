import jwt from 'jsonwebtoken'

// Middleware to verify JWT token
export const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
    req.userId = decoded.id
    req.userEmail = decoded.email
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' })
    }
    return res.status(403).json({ error: 'Invalid token', message: error.message })
  }
}

// Middleware for role-based access (admin only)
export const isAdmin = async (req, res, next) => {
  try {
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(req.userId);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authorization check failed' });
  }
}

// Helper to send standardized responses
export const sendResponse = (res, statusCode, message, data = null) => {
  const response = { message }
  if (data) response.data = data

  res.status(statusCode).json(response)
}

// Helper to handle errors
export const handleError = (res, error, statusCode = 500) => {
  console.error('Error:', error)
  res.status(statusCode).json({
    error: error.message || 'An error occurred',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  })
}
