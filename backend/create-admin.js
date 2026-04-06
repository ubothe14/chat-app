// Script to create an admin user
import mongoose from 'mongoose'
import User from './models/User.js'
import dotenv from 'dotenv'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chat-app'

async function createAdmin() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' })
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email)
      return
    }

    // Create admin user
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@chatapp.com',
      phone: '+1234567890',
      password: 'admin123',
      role: 'admin',
      verificationStatus: 'verified'
    })

    await adminUser.save()
    console.log('Admin user created successfully!')
    console.log('Email: admin@chatapp.com')
    console.log('Password: admin123')

  } catch (error) {
    console.error('Error creating admin:', error)
  } finally {
    await mongoose.connection.close()
  }
}

createAdmin()