import express from 'express'
import jwt from 'jsonwebtoken'
import { OAuth2Client } from 'google-auth-library'
import User from '../models/User.js'
import { verifyToken } from '../middleware/auth.js'

const router = express.Router()

// Generate JWT Token
const generateToken = (id, email) => {
  return jwt.sign({ id, email }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '7d',
  })
}

// Sign Up Route
router.post('/signup', async (req, res) => {
  try {
    const { name, email, phone, password, experience, targetExam, idDocumentName } = req.body

    // Validation
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: 'Name, email, phone, and password are required' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' })
    }

    // Create new user
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password, // Will be hashed by schema pre-save hook
      experience: experience || '',
      targetExam: targetExam || 'All',
      idDocumentName: idDocumentName || null,
      verificationStatus: idDocumentName ? 'pending' : 'unverified',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
    })

    await newUser.save()

    // Generate token
    const token = generateToken(newUser._id, newUser.email)

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        experience: newUser.experience,
        targetExam: newUser.targetExam,
        verificationStatus: newUser.verificationStatus,
        avatar: newUser.avatar,
      },
    })
  } catch (error) {
    console.error('Signup error:', error)
    res.status(500).json({ error: 'Signup failed', message: error.message })
  }
})

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // Find user (include password field for comparison)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password')
    
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    // Generate token
    const token = generateToken(user._id, user.email)

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        experience: user.experience,
        targetExam: user.targetExam,
        verificationStatus: user.verificationStatus,
        avatar: user.avatar,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed', message: error.message })
  }
})

// Google Sign-In Route
router.post('/google-signin', async (req, res) => {
  try {
    const { idToken } = req.body
    console.log(`📡 [Auth] Google Sign-In request received. Token present: ${!!idToken}`)

    if (!idToken) {
      console.error('❌ Google Sign-In failed: No ID Token provided')
      return res.status(400).json({ error: 'ID Token is required' })
    }

    const clientId = process.env.GOOGLE_CLIENT_ID
    if (!clientId) {
      console.error('❌ Google Sign-In failed: GOOGLE_CLIENT_ID not found in environment')
      return res.status(500).json({ error: 'Server configuration error: GOOGLE_CLIENT_ID missing' })
    }

    // Initialize or verify client inside the handler to ensure env is ready
    const googleClient = new OAuth2Client(clientId)

    // Verify Google ID Token
    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken,
        audience: clientId,
      })
    } catch (verifyError) {
      console.error('❌ Google Token Verification Error:', verifyError.message)
      return res.status(401).json({ 
        error: 'Google authentication failed', 
        message: verifyError.message,
        details: 'The token provided might be invalid, expired, or have an incorrect audience.'
      })
    }

    const payload = ticket.getPayload()
    const { email, name, picture, sub: googleId } = payload

    if (!email) {
      return res.status(400).json({ error: 'Google account must have an email' })
    }

    // Check if user exists
    let user = await User.findOne({ email: email.toLowerCase() })

    // If user doesn't exist, create one
    if (!user) {
      console.log(`🆕 Creating new user from Google: ${email}`)
      user = new User({
        name: name || 'Google User',
        email: email.toLowerCase().trim(),
        phone: '',
        experience: '',
        targetExam: 'All',
        verificationStatus: 'unverified',
        googleAuth: true,
        googleId: googleId,
        avatar: picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      })
      await user.save()
    } else {
      // Update googleId if not present (in case of transition from manual to google)
      if (!user.googleAuth) {
        console.log(`🔗 Linking existing account to Google: ${email}`)
        user.googleAuth = true
        user.googleId = googleId
        if (!user.avatar) user.avatar = picture
        await user.save()
      }
    }

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    // Generate token
    const token = generateToken(user._id, user.email)

    console.log(`✅ Google sign-in successful for: ${email}`)
    res.status(200).json({
      message: 'Google sign-in successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        experience: user.experience || '',
        targetExam: user.targetExam || 'All',
        verificationStatus: user.verificationStatus,
        avatar: user.avatar,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('🔥 Unexpected Google signin error:', error)
    res.status(500).json({ error: 'Google sign-in failed', message: error.message })
  }
})

// Verify Token Route
router.get('/verify', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({
      valid: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        experience: user.experience || '',
        targetExam: user.targetExam || 'All',
        verificationStatus: user.verificationStatus,
        avatar: user.avatar,
        role: user.role,
      }
    })
  } catch (error) {
    res.status(403).json({ error: 'Token verification failed' })
  }
})

// Logout Route
router.post('/logout', verifyToken, (req, res) => {
  // Token invalidation handled on frontend by removing stored token
  res.json({ message: 'Logged out successfully' })
})

export default router
