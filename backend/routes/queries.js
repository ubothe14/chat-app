import express from 'express';
import Query from '../models/Query.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// [USER] Submit a new support query
router.post('/', verifyToken, async (req, res) => {
    try {
        const { subject, message } = req.body;
        if (!subject || !message) {
            return res.status(400).json({ error: 'Subject and message are required' });
        }

        const query = new Query({
            userId: req.userId,
            subject,
            message
        });

        await query.save();
        res.status(201).json({ message: 'Query submitted successfully', query });
    } catch (error) {
        res.status(500).json({ error: 'Failed to submit query', message: error.message });
    }
});

// [USER] Get my queries
router.get('/my', verifyToken, async (req, res) => {
    try {
        const queries = await Query.find({ userId: req.userId }).sort({ createdAt: -1 });
        res.json({ queries });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch queries', message: error.message });
    }
});

// [ADMIN] Get all queries
router.get('/admin/all', verifyToken, isAdmin, async (req, res) => {
    try {
        const queries = await Query.find()
            .populate('userId', 'name email avatar')
            .sort({ createdAt: -1 });
        res.json({ queries });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch all queries', message: error.message });
    }
});

// [ADMIN] Reply to a query
router.put('/admin/:id/reply', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { adminReply } = req.body;

        if (!adminReply) {
            return res.status(400).json({ error: 'Reply content is required' });
        }

        const query = await Query.findByIdAndUpdate(
            id,
            { 
                adminReply, 
                status: 'resolved', 
                repliedAt: new Date() 
            },
            { new: true }
        );

        if (!query) return res.status(404).json({ error: 'Query not found' });

        res.json({ message: 'Reply sent successfully', query });
    } catch (error) {
        res.status(500).json({ error: 'Failed to reply to query', message: error.message });
    }
});

export default router;
