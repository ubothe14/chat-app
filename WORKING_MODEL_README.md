# Chat Web App - Working Model

## Overview
A working local model for user signups and admin management has been implemented. The application includes user registration, authentication, and admin panel for user management.

## Features Implemented

### User Signups
- User registration with name, email, phone, password, experience, target exam
- ID document upload for verification
- JWT-based authentication
- Password hashing with bcrypt

### Admin Panel
- Admin user creation and authentication
- User management dashboard
- View all users with pagination
- Update user roles (user/admin)
- Activate/deactivate users
- Delete users
- Verification status management

## How to Run

### Prerequisites
- Node.js
- MongoDB (local or cloud)
- npm

### Backend Setup
```bash
cd backend
npm install
npm run create-admin  # Creates admin user: admin@chatapp.com / admin123
npm run dev          # Starts server on http://localhost:5006
```

### Frontend Setup
```bash
cd frontend-root
npm install
npm run dev          # Starts on http://localhost:5173
```

### Testing
- Run `node test-api.js` to test signup/login
- Run `node test-admin.js` to test admin login
- Run `node test-admin-api.js` to test admin API

## Admin Access
- **Email:** admin@chatapp.com
- **Password:** admin123
- Login through the app and click the Admin tab (star icon) in the sidebar

## API Endpoints

### Auth
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify token

### Users (Admin)
- `GET /api/users/admin/all` - Get all users (admin only)
- `PUT /api/users/admin/:id/role` - Update user role
- `PUT /api/users/admin/:id/status` - Activate/deactivate user
- `DELETE /api/users/admin/:id` - Delete user

## Database
- MongoDB with Mongoose ODM
- User model with roles, verification status, etc.
- JWT tokens for authentication

## Security
- Password hashing
- JWT authentication
- Role-based access control
- Input validation

The application is now ready for local testing and development.