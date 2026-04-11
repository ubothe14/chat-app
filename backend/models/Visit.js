import mongoose from 'mongoose';

const visitSchema = new mongoose.Schema({
    ip: String,
    userAgent: String,
    deviceType: String,
    path: String,
    referrer: String,
}, { timestamps: true });

// Index for daily stats aggregation
visitSchema.index({ createdAt: -1 });

const Visit = mongoose.model('Visit', visitSchema);
export default Visit;
