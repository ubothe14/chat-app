import express from 'express'
import multer from 'multer'
import User from '../models/User.js'
import Visit from '../models/Visit.js'
import Notification from '../models/Notification.js'
import { verifyToken, isAdmin } from '../middleware/auth.js'

// Configure Multer for local storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/documents/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'))
  }
})
const upload = multer({ storage: storage })

// Configure Multer for avatars
const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/avatars/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'avatar-' + uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'))
  }
})
const uploadAvatar = multer({ 
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only images are allowed'))
    }
  }
})

const router = express.Router()

// Get user profile
router.get('/profile/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params

    const user = await User.findById(userId).select('-password')
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ user })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile', message: error.message })
  }
})

// Get current user profile
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password')
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ user })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile', message: error.message })
  }
})

// Update user profile
router.put('/profile/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params
    const { name, phone, experience, targetExam } = req.body

    // Check authorization - user can only update their own profile
    if (req.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { name, phone, experience, targetExam },
      { new: true, runValidators: true }
    ).select('-password')

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ message: 'Profile updated successfully', user })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile', message: error.message })
  }
})

// Get verified users for discovery
router.get('/discover', verifyToken, async (req, res) => {
  try {
    const users = await User.find({ 
      _id: { $ne: req.userId },
      isActive: true 
    })
    .select('name avatar verificationStatus bio')
    .sort({ lastLogin: -1 })
    .limit(50)

    res.json({ users })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch discovery users', message: error.message })
  }
})

// Get all users (for admin or directory)
router.get('/', async (req, res) => {
  try {
    const users = await User.find({ isActive: true })
      .select('-password')
      .limit(50)

    res.json({ users })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users', message: error.message })
  }
})

// Search users
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params

    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' })
    }

    const results = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ],
      isActive: true
    })
      .select('-password')
      .limit(20)

    res.json({ results })
  } catch (error) {
    res.status(500).json({ error: 'Search failed', message: error.message })
  }
})

// Request verification (upload document)
router.post('/:userId/request-verify', verifyToken, upload.single('document'), async (req, res) => {
  try {
    const { userId } = req.params

    if (req.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Document file is required' })
    }

    const documentName = req.file.originalname
    const documentPath = req.file.path.replace(/\\/g, '/') // Canonicalize path for web

    const user = await User.findByIdAndUpdate(
      userId,
      { 
        idDocumentName: documentName,
        idDocumentPath: documentPath,
        verificationStatus: 'pending'
      },
      { new: true }
    ).select('-password')

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({
      message: 'Verification request submitted',
      user
    })
  } catch (error) {
    res.status(500).json({ error: 'Verification request failed', message: error.message })
  }
})

// Upload avatar
router.post('/:userId/avatar', verifyToken, uploadAvatar.single('avatar'), async (req, res) => {
  try {
    const { userId } = req.params

    if (req.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Avatar file is required' })
    }

    const avatarPath = '/' + req.file.path.replace(/\\/g, '/') // Canonicalize path for web

    const user = await User.findByIdAndUpdate(
      userId,
      { avatar: avatarPath },
      { new: true }
    ).select('-password')

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({
      message: 'Avatar updated successfully',
      user
    })
  } catch (error) {
    res.status(500).json({ error: 'Avatar upload failed', message: error.message })
  }
})

// Admin: Verify user (approve document)
router.post('/:userId/verify', verifyToken, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params
    const { action } = req.body // 'approve' or 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Valid action (approve/reject) is required' })
    }

    const status = action === 'approve' ? 'verified' : 'rejected'

    const user = await User.findByIdAndUpdate(
      userId,
      { verificationStatus: status },
      { new: true }
    ).select('-password')

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({
      message: `User ${action}ed successfully`,
      user
    })
  } catch (error) {
    res.status(500).json({ error: 'Admin verification failed', message: error.message })
  }
})

// Get pending verification requests (admin only)
router.get('/admin/pending-verifications', verifyToken, isAdmin, async (req, res) => {
  try {
    const pendingRequests = await User.find({ 
      verificationStatus: 'pending'
    })
      .select('-password')

    res.json({ pendingRequests })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending requests', message: error.message })
  }
})

// Admin: Get Dashboard Statistics (Enhanced)
router.get('/admin/dashboard-stats', verifyToken, isAdmin, async (req, res) => {
  try {
    const Conversation = (await import('../models/Conversation.js')).default;
    const Message = (await import('../models/Message.js')).default;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalUsers = await User.countDocuments();
    const registrationsToday = await User.countDocuments({ createdAt: { $gte: today } });
    const totalHits = await Visit.countDocuments();
    const hitsToday = await Visit.countDocuments({ createdAt: { $gte: today } });
    
    const activeUsers = await User.countDocuments({ 
        lastLogin: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } 
    });
    
    const totalMessages = await Message.countDocuments();
    const totalGroups = await Conversation.countDocuments({ isGroup: true });
    
    const pendingVerifications = await User.countDocuments({ verificationStatus: 'pending' });
    const verifiedUsers = await User.countDocuments({ verificationStatus: 'verified' });
    const rejectedUsers = await User.countDocuments({ verificationStatus: 'rejected' });
    
    const userWithDocs = await User.countDocuments({ idDocumentPath: { $ne: null } });

    res.json({
      totalUsers,
      registrationsToday,
      totalHits,
      hitsToday,
      activeUsers,
      totalMessages,
      totalGroups,
      pendingVerifications,
      verifiedUsers,
      rejectedUsers,
      userWithDocs,
      serverUptime: process.uptime(),
      memoryUsage: process.memoryUsage().heapUsed
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats', message: error.message });
  }
});

// Admin: Get Time-Series Statistics for Graphs
router.get('/admin/timeseries-stats', verifyToken, isAdmin, async (req, res) => {
  try {
    const Message = (await import('../models/Message.js')).default;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Group user registrations by day
    const registrations = await User.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: { 
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 } 
        } 
      },
      { $sort: { "_id": 1 } }
    ]);

    // Group messages by day
    const activity = await Message.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: { 
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 } 
        } 
      },
      { $sort: { "_id": 1 } }
    ]);

    res.json({ registrations, activity });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch timeseries stats', message: error.message });
  }
});

// Admin: Broadcast message to all users
router.post('/admin/broadcast', verifyToken, isAdmin, async (req, res) => {
  try {
    const { text, title } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Broadcast text is required' });
    }

    const notification = new Notification({
      type: 'broadcast',
      title: title || 'Global Announcement',
      message: text,
      senderId: req.userId
    });

    await notification.save();
    
    console.log(`[Admin Broadcast] From: ${req.userId} Content: ${text}`);

    res.json({ 
      message: `Broadcast sent precisely to all network nodes.`,
      notification 
    });
  } catch (error) {
    res.status(500).json({ error: 'Broadcast failed', message: error.message });
  }
});

// Get user statistics
router.get('/stats/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const stats = {
      userId,
      name: user.name,
      email: user.email,
      verificationStatus: user.verificationStatus,
      joinedDate: user.createdAt,
      lastLogin: user.lastLogin,
    }

    res.json({ stats })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats', message: error.message })
  }
})

// Admin: Get all users with pagination
router.get('/admin/all', verifyToken, isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit

    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await User.countDocuments()

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users', message: error.message })
  }
})

// Admin: Update user role
router.put('/admin/:userId/role', verifyToken, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params
    const { role } = req.body

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be user or admin' })
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    ).select('-password')

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ message: 'User role updated successfully', user })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user role', message: error.message })
  }
})

// Admin: Deactivate/Activate user
router.put('/admin/:userId/status', verifyToken, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params
    const { isActive } = req.body

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive must be a boolean' })
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true, runValidators: true }
    ).select('-password')

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ message: `User ${isActive ? 'activated' : 'deactivated'} successfully`, user })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user status', message: error.message })
  }
})

// Admin: Delete user
router.delete('/admin/:userId', verifyToken, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params

    const user = await User.findByIdAndDelete(userId)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ message: 'User deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user', message: error.message })
  }
})

export default router
