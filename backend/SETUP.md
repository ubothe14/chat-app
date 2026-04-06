# Backend Setup Guide

## Quick Start

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Configure Environment
Create a `.env` file (already created, just update if needed):
```
PORT=5000
NODE_ENV=development
JWT_SECRET=your-secret-key
```

### Step 3: Start the Server
```bash
# Development with auto-reload
npm run dev

# Production
npm start
```

The server will run on `http://localhost:5000`

## Project Structure

```
backend/
├── server.js              # Main server file
├── package.json           # Dependencies
├── .env                   # Environment variables
├── .gitignore             # Git ignore rules
├── README.md              # Full documentation
├── middleware/
│   └── auth.js            # Authentication middleware
└── routes/
    ├── auth.js            # Authentication routes
    ├── users.js           # User management routes
    └── chat.js            # Chat/messaging routes
```

## Available Routes

### Authentication (`/api/auth`)
- **POST** `/signup` - Register new user
- **POST** `/login` - Login user
- **POST** `/google-signin` - Google Sign-In
- **POST** `/logout` - Logout user

### Users (`/api/users`)
- **GET** `/` - List all users
- **GET** `/profile/:userId` - Get user profile
- **PUT** `/profile/:userId` - Update profile
- **POST** `/:userId/verify` - Request verification
- **POST** `/:userId/admin-verify` - Admin verification
- **GET** `/admin/pending-verifications` - Get pending verifications
- **GET** `/search?query=term` - Search users

### Chat (`/api/chat`)
- **GET** `/:userId/conversations` - Get conversations
- **GET** `/conversation/:conversationId/messages` - Get messages
- **POST** `/send` - Send message
- **POST** `/conversation` - Create conversation
- **PUT** `/:messageId` - Edit message
- **DELETE** `/:messageId` - Delete message
- **GET** `/stats/:userId` - Get stats

## Testing the Backend

### Using cURL or Postman

1. **Sign Up**
```bash
POST http://localhost:5000/api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+91 98765 43210",
  "password": "SecurePass123",
  "experience": "2",
  "targetExam": "CAT"
}
```

2. **Login**
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

3. **Get User Profile**
```bash
GET http://localhost:5000/api/users/profile/user-id
Authorization: Bearer <your-token>
```

## Important Notes

- The current implementation uses **in-memory storage** for demo purposes
- For **production**, integrate **MongoDB** (already configured in dependencies)
- Update `JWT_SECRET` in `.env` file
- Use environment variables for sensitive data
- Token-based authentication is implemented
- CORS is enabled for frontend communication

## Next Steps

1. Install npm packages: `npm install`
2. Update `.env` with real values
3. Run dev server: `npm run dev`
4. Test endpoints with Postman or cURL
5. Integrate MongoDB for persistence
6. Add WebSocket for real-time messaging
7. Implement file uploads for document verification
