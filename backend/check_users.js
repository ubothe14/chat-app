import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('UserTemp', userSchema, 'users');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const allCount = await User.countDocuments();
  const activeCount = await User.countDocuments({ isActive: true });
  const typeActive = await User.countDocuments({ isActive: { $exists: true } });

  console.log(`Total users: ${allCount}`);
  console.log(`Active users: ${activeCount}`);
  console.log(`Users with isActive field: ${typeActive}`);
  
  process.exit(0);
}

test();
