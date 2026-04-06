# Chat App Backend API

Node.js + Express backend for the Chat Application with authentication, user management, and real-time messaging support.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Edit `.env` file with your settings:
```
PORT=5000
JWT_SECRET=your-secret-key
MONGODB_URI=mongodb://localhost:27017/chat-app
```

### 3. Run the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server will run on `http://localhost:5000`

## API Routes

### Authentication Routes (`/api/auth`)
- `POST /signup` - Register a new user
  - Body: `{ name, email, phone, password, experience, targetExam, idDocumentName }`
  - Returns: `{ token, user }`

- `POST /login` - Login user
  - Body: `{ email, password }`
  - Returns: `{ token, user }`

- `POST /google-signin` - Google Sign-In
  - Body: `{ email, name, idToken }`
  - Returns: `{ token, user }`

- `POST /logout` - Logout user
  - Returns: `{ message }`

### User Routes (`/api/users`)
- `GET /` - Get all users
- `GET /profile/:userId` - Get user profile
- `PUT /profile/:userId` - Update user profile
- `POST /:userId/verify` - Request verification (upload document)
- `POST /:userId/admin-verify` - Admin verify/reject user
  - Body: `{ action: 'approve' | 'reject' }`
- `GET /admin/pending-verifications` - Get pending verification requests (admin)
- `GET /search` - Search users
  - Query: `?query=search_term`

### Chat Routes (`/api/chat`)
- `GET /:userId/conversations` - Get all conversations for user
- `GET /conversation/:conversationId/messages` - Get messages in conversation
- `POST /send` - Send a message
  - Body: `{ conversationId, senderId, text, type }`
- `POST /conversation` - Create new conversation
  - Body: `{ userId, recipientId }`
- `PUT /:messageId` - Edit a message
  - Body: `{ text }`
- `DELETE /:messageId` - Delete a message
- `GET /stats/:userId` - Get chat statistics

### General Routes
- `GET /` - Home/API info
- `GET /api/health` - Health check

## Example Requests

### Sign Up
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+91 98765 43210",
    "password": "SecurePass123",
    "experience": "2",
    "targetExam": "CAT",
    "idDocumentName": "passport.jpg"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

### Get User Profile
```bash
curl -X GET http://localhost:5000/api/users/profile/user-id \
  -H "Authorization: Bearer your-token"
```

### Send Message
```bash
curl -X POST http://localhost:5000/api/chat/send \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "conv-123",
    "senderId": "user-1",
    "text": "Hello, how are you?",
    "type": "text"
  }'
```

## Features

✅ User authentication (signup/login)
✅ Google Sign-In support
✅ JWT-based authorization
✅ User profile management
✅ Document verification workflow
✅ Messaging system
✅ Conversation management
✅ Password hashing with bcryptjs
✅ CORS enabled
✅ Error handling

## Future Enhancements

- [ ] MongoDB integration
- [ ] WebSocket for real-time messaging
- [ ] File upload/storage
- [ ] Message reactions
- [ ] Typing indicators
- [ ] Read receipts
- [ ] Group conversations
- [ ] User blocking/reporting
- [ ] Email verification
- [ ] Admin dashboard endpoints

## Dependencies

- **express** - Web framework
- **cors** - Cross-origin requests
- **dotenv** - Environment variables
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **mongoose** - MongoDB ODM (optional, for future use)
- **nodemon** - Development auto-reload

## License

MIT
