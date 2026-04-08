import express from 'express'
import { StreamClient } from '@stream-io/node-sdk'
import { verifyToken } from '../middleware/auth.js'
import User from '../models/User.js'

const router = express.Router()

const apiKey = process.env.STREAM_API_KEY
const apiSecret = process.env.STREAM_SECRET

if (!apiKey || !apiSecret) {
  console.warn('⚠️ Stream API Key or Secret is missing from environment variables')
} else {
  console.log('✅ Stream API credentials loaded successfully');
}

// Get Stream token for the authenticated user
router.get('/token', verifyToken, async (req, res) => {
  try {
    const userId = req.userId
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    if (!apiKey || !apiSecret) {
      return res.status(500).json({ error: 'Stream configuration missing on server' })
    }

    const client = new StreamClient(apiKey, apiSecret)
    
    // Ensure the current user exists in Stream
    const user = await User.findById(userId)
    if (user) {
      await client.upsertUsers([{
        id: userId,
        name: user.name,
        role: 'user',
        image: user.avatar ? `${process.env.FRONTEND_URL}/api${user.avatar}` : undefined
      }])
    }

    // Create a token that expires in 1 hour
    const token = client.createToken(userId)

    console.log(`✅ Generated Stream token & synced user: ${userId}`);
    res.json({ token, apiKey })
  } catch (error) {
    console.error('❌ Error generating Stream token:', error)
    res.status(500).json({ error: 'Failed to generate video token', message: error.message })
  }
})

// Sync multiple users with Stream (useful before starting a call)
router.post('/sync-users', verifyToken, async (req, res) => {
  try {
    const { userIds } = req.body
    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ error: 'Invalid userIds provided' })
    }

    const client = new StreamClient(apiKey, apiSecret)
    const users = await User.find({ _id: { $in: userIds } })
    
    const streamUsers = users.map(u => ({
      id: u._id.toString(),
      name: u.name,
      role: 'user',
      image: u.avatar ? `${process.env.FRONTEND_URL}/api${u.avatar}` : undefined
    }))

    if (streamUsers.length > 0) {
      await client.upsertUsers(streamUsers)
      console.log(`✅ Synced ${streamUsers.length} users with Stream`);
    }

    res.json({ success: true, count: streamUsers.length })
  } catch (error) {
    console.error('❌ Error syncing users with Stream:', error)
    res.status(500).json({ error: 'Failed to sync users', message: error.message })
  }
})

export default router
