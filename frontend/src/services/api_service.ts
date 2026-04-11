// API service for frontend - handles all backend communication

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5006/api'

export function getFullImageUrl(path: string | undefined | null) {
  if (!path) return null
  if (path.startsWith('http')) return path
  const backendUrl = API_URL.replace('/api', '')
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${backendUrl}${cleanPath}`
}

export interface User {
  _id?: string
  id?: string
  name: string
  email: string
  avatar?: string
  phone?: string
  password?: string
  idDocumentName?: string
  idDocumentPath?: string
  verificationStatus?: 'unverified' | 'pending' | 'verified' | 'rejected'
  role?: 'user' | 'admin'
  experience?: string
  bio?: string
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
  readBy?: { userId: string; readAt: string }[]
  reactions?: { userId: string; emoji: string }[]
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
  status?: 'pending' | 'accepted' | 'rejected'
  createdBy?: string
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
    console.log(`📡 [Debug] API Request: ${options.method || 'GET'} ${url}`)
    const response = await fetch(url, {
      ...options,
      headers,
    })

    console.log(`📥 [Debug] API Response: ${response.status} ${response.statusText} for ${url}`)
    
    const data = await response.json()

    if (!response.ok) {
      console.error(`❌ [Debug] API Error Status: ${response.status}`, data)
      throw new Error(data.error || 'API request failed')
    }

    return data as T
  } catch (error) {
    console.error('❌ [Debug] API Call Exception:', error)
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

  googleSignIn: (idToken: string) =>
    apiCall<{ message: string; token: string; user: User }>('/auth/google-signin', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
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

  uploadAvatar: (userId: string, formData: FormData) =>
    apiCall<{ message: string; user: User }>(`/users/${userId}/avatar`, {
      method: 'POST',
      body: formData,
    }),

  verifyUser: (userId: string, action: 'approve' | 'reject') =>
    apiCall<{ message: string; user: User }>(`/users/${userId}/verify`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    }),

  getPendingVerifications: () =>
    apiCall<{ pendingRequests: User[] }>('/users/admin/pending-verifications', {
      method: 'GET',
    }),

  getAdminDashboardStats: () =>
    apiCall<{
      totalUsers: number;
      activeUsers: number;
      totalMessages: number;
      totalGroups: number;
      pendingVerifications: number;
      verifiedUsers: number;
      unverifiedUsers: number;
      userWithDocs: number;
      serverUptime: number;
      memoryUsage: number;
    }>('/users/admin/dashboard-stats', {
      method: 'GET',
    }),

  getAdminTimeseriesStats: () =>
    apiCall<{
      registrations: Array<{ _id: string; count: number }>;
      activity: Array<{ _id: string; count: number }>;
    }>('/users/admin/timeseries-stats', {
      method: 'GET',
    }),

  broadcastMessage: (text: string) =>
    apiCall<{ message: string; recipientCount: number }>('/users/admin/broadcast', {
      method: 'POST',
      body: JSON.stringify({ text }),
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

  createGroup: (participants: string[], groupName: string, groupIcon?: string) =>
    apiCall<{ conversation: Conversation }>('/chat/group/create', {
      method: 'POST',
      body: JSON.stringify({ participants, groupName, groupIcon }),
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

  reactToMessage: (messageId: string, emoji: string) =>
    apiCall<{ message: string; reactions: any[] }>(`/chat/message/${messageId}/react`, {
      method: 'PATCH',
      body: JSON.stringify({ emoji }),
    }),

  deleteMessagesBulk: (messageIds: string[]) =>
    apiCall<{ message: string }>('/chat/messages/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ messageIds }),
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

export const videoAPI = {
  getToken: () =>
    apiCall<{ token: string; apiKey: string }>('/video/token'),
  syncUsers: (userIds: string[]) =>
    apiCall<{ success: boolean; count: number }>('/video/sync-users', {
      method: 'POST',
      body: JSON.stringify({ userIds }),
    }),
}
