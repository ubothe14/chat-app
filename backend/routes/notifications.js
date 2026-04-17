import express from 'express'
import Notification from '../models/Notification.js'
import User from '../models/User.js'
import Conversation from '../models/Conversation.js'
import { verifyToken } from '../middleware/auth.js'

const router = express.Router()

// Get notifications for current user (personal + broadcast)
router.get('/', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const query = {
        isActive: true,
        $or: [
            { type: 'broadcast' },
            { type: 'system' }
        ]
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('senderId', 'name avatar')

    const pendingConversations = await Conversation.find({
      isGroup: false,
      status: 'pending',
      participants: req.userId,
      createdBy: { $ne: req.userId }
    }).populate('createdBy', 'name avatar')

    const requestNotifications = pendingConversations.map(conv => ({
      _id: conv._id.toString(),
      type: 'connection_request',
      title: 'New Connection Request',
      message: `${conv.createdBy?.name || 'Someone'} sent you a connection request.`,
      senderId: conv.createdBy,
      conversationId: conv._id.toString(),
      isActive: true,
      createdAt: conv.createdAt
    }))

    const allNotifications = [...notifications.map(n => n.toObject()), ...requestNotifications]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    res.json({ notifications: allNotifications })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications', message: error.message })
  }
})

// Mark notification as read (Dismiss)
router.put('/:id/read', verifyToken, async (req, res) => {
  try {
    // If it's a global broadcast, "read" might mean removing it from the user's view.
    // Realistically you'd have a UserNotification model or an array on the User marking dismissed IDs.
    // For simplicity, we just return a success and let frontend handle filtering.
    res.json({ message: 'Notification marked as read' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark notification as read', message: error.message })
  }
})

export default router
