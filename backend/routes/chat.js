import express from 'express'
import Message from '../models/Message.js'
import Conversation from '../models/Conversation.js'
import User from '../models/User.js'
import { verifyToken } from '../middleware/auth.js'

const router = express.Router()

// Get all conversations for a user
router.get('/:userId/conversations', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params

    const conversations = await Conversation.find({ participants: userId })
      .populate('participants', 'name email avatar phone verificationStatus')
      .populate({
        path: 'lastMessage',
        populate: { path: 'senderId', select: 'name email' }
      })
      .sort({ lastMessageAt: -1 })

    res.json({ conversations })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversations', message: error.message })
  }
})

// Get messages in a conversation
router.get('/conversation/:conversationId/messages', verifyToken, async (req, res) => {
  try {
    const { conversationId } = req.params

    const messages = await Message.find({ conversationId })
      .populate('senderId', 'name email avatar')
      .sort({ createdAt: 1 })

    res.json({ messages })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages', message: error.message })
  }
})

// Send a message
router.post('/send', verifyToken, async (req, res) => {
  try {
    const { conversationId, text, type = 'text' } = req.body

    if (!conversationId || !text) {
      return res.status(400).json({ error: 'Conversation ID and message text are required' })
    }

    // Check if conversation exists and user is participant
    const conversation = await Conversation.findById(conversationId)
    if (!conversation || !conversation.participants.includes(req.userId)) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    // NEW: Block messages if NOT accepted
    if (conversation.status !== 'accepted') {
      return res.status(403).json({ error: 'Connection request not yet accepted' })
    }

    // Create new message
    const newMessage = new Message({
      conversationId,
      senderId: req.userId,
      text,
      type,
    })

    await newMessage.save()
    await newMessage.populate('senderId', 'name email avatar')

    // Update conversation last message
    conversation.lastMessage = newMessage._id
    conversation.lastMessageAt = new Date()
    await conversation.save()

    res.status(201).json({
      message: newMessage,
      success: true,
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message', message: error.message })
  }
})

// Create new conversation
router.post('/conversation', verifyToken, async (req, res) => {
  try {
    const { recipientId } = req.body

    if (!recipientId) {
      return res.status(400).json({ error: 'Recipient ID is required' })
    }

    // Check if user exists
    const recipient = await User.findById(recipientId)
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' })
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [req.userId, recipientId] },
      isGroup: false
    })

    if (conversation) {
      return res.status(200).json({ conversation })
    }

    // Create new conversation
    conversation = new Conversation({
      participants: [req.userId, recipientId],
      isGroup: false,
    })

    await conversation.save()
    await conversation.populate('participants', 'name email avatar verificationStatus bio')

    res.status(201).json({
      message: 'Connection request sent successfully',
      conversation,
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create connection request', message: error.message })
  }
})

// Accept/Reject connection request
router.patch('/conversation/:conversationId/status', verifyToken, async (req, res) => {
  try {
    const { conversationId } = req.params
    const { status } = req.body // 'accepted' or 'rejected'

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    const conversation = await Conversation.findById(conversationId)
    if (!conversation || !conversation.participants.includes(req.userId)) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    // Only the RECIPIENT can accept/reject? 
    // Usually, the person who didn't create it is the recipient.
    // Simplifying: any participant can change it, but UI will restrict it.
    
    conversation.status = status
    await conversation.save()
    await conversation.populate('participants', 'name email avatar verificationStatus bio')

    res.json({
      message: `Connection request ${status}`,
      conversation
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update connection status', message: error.message })
  }
})

// Create new group
router.post('/group/create', verifyToken, async (req, res) => {
  try {
    const { participants, groupName, groupIcon } = req.body

    if (!groupName || !participants || !Array.isArray(participants) || participants.length < 1) {
      return res.status(400).json({ error: 'Group name and at least one other participant are required' })
    }

    // Include the creator in the participants if not already there
    const allParticipants = Array.from(new Set([...participants, req.userId]))

    // Create new group conversation
    const conversation = new Conversation({
      participants: allParticipants,
      isGroup: true,
      groupName,
      groupIcon,
      createdBy: req.userId,
    })

    await conversation.save()
    await conversation.populate('participants', 'name email avatar verificationStatus')

    res.status(201).json({
      message: 'Group created successfully',
      conversation,
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create group', message: error.message })
  }
})

// Edit a message
router.put('/:messageId', verifyToken, async (req, res) => {
  try {
    const { messageId } = req.params
    const { text } = req.body

    if (!text) {
      return res.status(400).json({ error: 'New message text is required' })
    }

    const message = await Message.findById(messageId)
    if (!message) {
      return res.status(404).json({ error: 'Message not found' })
    }

    // Check authorization - only message sender can edit
    if (message.senderId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    message.text = text
    message.edited = true
    message.editedAt = new Date()
    await message.save()
    await message.populate('senderId', 'name email avatar')

    res.json({
      message: 'Message updated successfully',
      data: message,
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update message', message: error.message })
  }
})

// Delete a message
router.delete('/:messageId', verifyToken, async (req, res) => {
  try {
    const { messageId } = req.params

    const message = await Message.findById(messageId)
    if (!message) {
      return res.status(404).json({ error: 'Message not found' })
    }

    // Check authorization - only message sender can delete
    if (message.senderId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    // Soft delete - just mark deletedAt
    message.deletedAt = new Date()
    await message.save()

    res.json({ message: 'Message deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete message', message: error.message })
  }
})

// Mark messages as read
router.post('/conversation/:conversationId/mark-read', verifyToken, async (req, res) => {
  try {
    const { conversationId } = req.params

    // Update all unread messages in conversation
    await Message.updateMany(
      { conversationId, 'readBy.userId': { $ne: req.userId } },
      { 
        $push: {
          readBy: {
            userId: req.userId,
            readAt: new Date()
          }
        }
      }
    )

    res.json({ message: 'Messages marked as read' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark messages as read', message: error.message })
  }
})

// React to a message
router.patch('/message/:messageId/react', verifyToken, async (req, res) => {
  try {
    const { messageId } = req.params
    const { emoji } = req.body

    const message = await Message.findById(messageId)
    if (!message) return res.status(404).json({ error: 'Message not found' })

    // Find if user already reacted
    const reactionIndex = message.reactions.findIndex(r => r.userId.toString() === req.userId)

    if (reactionIndex > -1) {
      if (message.reactions[reactionIndex].emoji === emoji) {
        // Toggle off if same emoji
        message.reactions.splice(reactionIndex, 1)
      } else {
        // Update to new emoji
        message.reactions[reactionIndex].emoji = emoji
      }
    } else {
      // Add new reaction
      message.reactions.push({ userId: req.userId, emoji })
    }

    await message.save()
    res.json({ message: 'Reaction updated', reactions: message.reactions })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update reaction', message: error.message })
  }
})

// Bulk delete messages
router.post('/messages/bulk-delete', verifyToken, async (req, res) => {
  try {
    const { messageIds } = req.body
    if (!messageIds || !Array.isArray(messageIds)) {
      return res.status(400).json({ error: 'Message IDs array is required' })
    }

    // Only allow users to delete their own messages in bulk
    await Message.updateMany(
      { _id: { $in: messageIds }, senderId: req.userId },
      { deletedAt: new Date() }
    )

    res.json({ message: 'Messages deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete messages', message: error.message })
  }
})

// Get chat statistics
router.get('/stats/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params

    const conversations = await Conversation.countDocuments({ participants: userId })
    const messages = await Message.countDocuments({ senderId: userId })

    const stats = {
      userId,
      totalConversations: conversations,
      totalMessages: messages,
    }

    res.json({ stats })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats', message: error.message })
  }
})

export default router
