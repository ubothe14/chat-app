import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Conversation from './models/Conversation.js';

dotenv.config();

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('📦 Connected to MongoDB');

        const result = await Conversation.updateMany({}, { $set: { status: 'pending' } });
        console.log(`✅ successfully reset ${result.modifiedCount} conversations to pending status.`);

        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
};

migrate();
