// API service for frontend - handles all backend communication

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5006/api'

export interface User {
  _id?: string
  id?: string
  name: string
  email: string
  avatar?: string
  phone?: string
  password?: string
  idDocumentName?: string
  verificationStatus?: 'unverified' | 'pending' | 'verified' | 'rejected'
  role?: 'user' | 'admin'
  experience?: string
  targetExam?: string
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface Message {
  _id: string
  conversationId: string
  senderId: User | string
  text: string
  type: 'text' | 'image' | 'video'
  edited?: boolean
  editedAt?: string | null
  deletedAt?: string | null
  readBy?: string[]
  createdAt: string
  updatedAt?: string
}

export interface Conversation {
  _id: string
  participants: User[]
  lastMessage: Message | null
  lastMessageAt: string | null
  unreadCounts: { userId: string; count: number }[]
  isGroup: boolean
  groupName: string | null
  groupIcon: string | null
  createdAt: string
}

interface ApiOptions extends RequestInit {
  headers?: Record<string, string>
  body?: any
}

// Helper function to handle API calls
export const apiCall = async <T>(endpoint: string, options: ApiOptions = {}): Promise<T> => {
  const url = `${API_URL}${endpoint}`
  const token = localStorage.getItem('authToken')

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // If using FormData (e.g. for uploads), let the browser set the Content-Type with the boundary
  if (options.body instanceof FormData) {
    delete headers['Content-Type']
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'API request failed')
    }

    return data as T
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}

// Auth API calls
export const authAPI = {
  signup: (userData: any) =>
    apiCall<{ message: string; token: string; user: User }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  login: (email: string, password?: string) =>
    apiCall<{ message: string; token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  googleSignIn: (email: string, name: string, idToken: string) =>
    apiCall<{ message: string; token: string; user: User }>('/auth/google-signin', {
      method: 'POST',
      body: JSON.stringify({ email, name, idToken }),
    }),

  verifyToken: () =>
    apiCall<{ valid: boolean; user: User }>('/auth/verify', {
      method: 'GET',
    }),

  logout: () =>
    apiCall<{ message: string }>('/auth/logout', {
      method: 'POST',
    }),
}

// User API calls
export const userAPI = {
  getProfile: (userId: string) =>
    apiCall<{ user: User }>(`/users/profile/${userId}`, {
      method: 'GET',
    }),

  getCurrentUser: () =>
    apiCall<{ user: User }>('/users/me', {
      method: 'GET',
    }),

  updateProfile: (userId: string, userData: Partial<User>) =>
    apiCall<{ message: string; user: User }>(`/users/profile/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),

  getAllUsers: () =>
    apiCall<{ users: User[] }>('/users', {
      method: 'GET',
    }),

  searchUsers: (query: string) =>
    apiCall<{ results: User[] }>(`/users/search/${query}`, {
      method: 'GET',
    }),

  requestVerification: (userId: string, formData: FormData) =>
    apiCall<{ message: string; user: User }>(`/users/${userId}/request-verify`, {
      method: 'POST',
      body: formData,
    }),

  verifyUser: (userId: string, action: 'approve' | 'reject') =>
    apiCall<{ message: string; user: User }>(`/users/${userId}/verify`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    }),

  getPendingVerifications: () =>
    apiCall<{ users: User[] }>('/users/admin/pending-verifications', {
      method: 'GET',
    }),

  getAllUsersAdmin: (params: any = {}) =>
    apiCall<{ users: User[]; pagination: { total: number; pages: number; page: number; limit: number } }>(`/users/admin/all?${new URLSearchParams(params)}`, {
      method: 'GET',
    }),

  updateUserRole: (userId: string, role: string) =>
    apiCall<{ user: User }>(`/users/admin/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),

  updateUserStatus: (userId: string, isActive: boolean) =>
    apiCall<{ user: User }>(`/users/admin/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ isActive }),
    }),

  deleteUser: (userId: string) =>
    apiCall<{ message: string }>(`/users/admin/${userId}`, {
      method: 'DELETE',
    }),

  getStats: (userId: string) =>
    apiCall<any>(`/users/stats/${userId}`, {
      method: 'GET',
    }),
}

// Chat API calls
export const chatAPI = {
  getConversations: (userId: string) =>
    apiCall<{ conversations: Conversation[] }>(`/chat/${userId}/conversations`, {
      method: 'GET',
    }),

  getMessages: (conversationId: string) =>
    apiCall<{ messages: Message[] }>(`/chat/conversation/${conversationId}/messages`, {
      method: 'GET',
    }),

  sendMessage: (conversationId: string, text: string, type = 'text') =>
    apiCall<{ message: Message }>('/chat/send', {
      method: 'POST',
      body: JSON.stringify({ conversationId, text, type }),
    }),

  createConversation: (recipientId: string) =>
    apiCall<{ conversation: Conversation }>('/chat/conversation', {
      method: 'POST',
      body: JSON.stringify({ recipientId }),
    }),

  editMessage: (messageId: string, text: string) =>
    apiCall<{ message: Message }>(`/chat/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify({ text }),
    }),

  deleteMessage: (messageId: string) =>
    apiCall<{ message: string }>(`/chat/${messageId}`, {
      method: 'DELETE',
    }),

  markAsRead: (conversationId: string) =>
    apiCall<{ message: string }>(`/chat/conversation/${conversationId}/mark-read`, {
      method: 'POST',
    }),

  getStats: (userId: string) =>
    apiCall<any>(`/chat/stats/${userId}`, {
      method: 'GET',
    }),
}

// Helper to manage auth token
export const tokenManager = {
  setToken: (token: string) => {
    localStorage.setItem('authToken', token)
  },

  getToken: () => {
    return localStorage.getItem('authToken')
  },

  removeToken: () => {
    localStorage.removeItem('authToken')
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('authToken')
  },
}
