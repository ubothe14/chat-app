import mongoose from 'mongoose';

const querySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['open', 'in-progress', 'resolved'],
        default: 'open'
    },
    adminReply: {
        type: String,
        default: null
    },
    repliedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

const Query = mongoose.model('Query', querySchema);
export default Query;
