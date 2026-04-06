// API service for frontend - handles all backend communication

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5006/api'

// Helper function to handle API calls
export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`
  const token = localStorage.getItem('authToken')

  const headers = {
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

    return data
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}

// Auth API calls
export const authAPI = {
  signup: (userData) =>
    apiCall('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  login: (email, password) =>
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  googleSignIn: (email, name, idToken) =>
    apiCall('/auth/google-signin', {
      method: 'POST',
      body: JSON.stringify({ email, name, idToken }),
    }),

  verifyToken: () =>
    apiCall('/auth/verify', {
      method: 'GET',
    }),

  logout: () =>
    apiCall('/auth/logout', {
      method: 'POST',
    }),
}

// User API calls
export const userAPI = {
  getProfile: (userId) =>
    apiCall(`/users/profile/${userId}`, {
      method: 'GET',
    }),

  getCurrentUser: () =>
    apiCall('/users/me', {
      method: 'GET',
    }),

  updateProfile: (userId, userData) =>
    apiCall(`/users/profile/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),

  getAllUsers: () =>
    apiCall('/users', {
      method: 'GET',
    }),

  searchUsers: (query) =>
    apiCall(`/users/search/${query}`, {
      method: 'GET',
    }),

  requestVerification: (userId, formData) =>
    apiCall(`/users/${userId}/request-verify`, {
      method: 'POST',
      body: formData,
    }),

  verifyUser: (userId, action) =>
    apiCall(`/users/${userId}/verify`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    }),

  getPendingVerifications: () =>
    apiCall('/users/admin/pending-verifications', {
      method: 'GET',
    }),

  getAllUsersAdmin: (params = {}) =>
    apiCall(`/users/admin/all?${new URLSearchParams(params)}`, {
      method: 'GET',
    }),

  updateUserRole: (userId, role) =>
    apiCall(`/users/admin/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),

  updateUserStatus: (userId, isActive) =>
    apiCall(`/users/admin/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ isActive }),
    }),

  deleteUser: (userId) =>
    apiCall(`/users/admin/${userId}`, {
      method: 'DELETE',
    }),

  getStats: (userId) =>
    apiCall(`/users/stats/${userId}`, {
      method: 'GET',
    }),
}

// Chat API calls
export const chatAPI = {
  getConversations: (userId) =>
    apiCall(`/chat/${userId}/conversations`, {
      method: 'GET',
    }),

  getMessages: (conversationId) =>
    apiCall(`/chat/conversation/${conversationId}/messages`, {
      method: 'GET',
    }),

  sendMessage: (conversationId, text, type = 'text') =>
    apiCall('/chat/send', {
      method: 'POST',
      body: JSON.stringify({ conversationId, text, type }),
    }),

  createConversation: (recipientId) =>
    apiCall('/chat/conversation', {
      method: 'POST',
      body: JSON.stringify({ recipientId }),
    }),

  editMessage: (messageId, text) =>
    apiCall(`/chat/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify({ text }),
    }),

  deleteMessage: (messageId) =>
    apiCall(`/chat/${messageId}`, {
      method: 'DELETE',
    }),

  markAsRead: (conversationId) =>
    apiCall(`/chat/conversation/${conversationId}/mark-read`, {
      method: 'POST',
    }),

  getStats: (userId) =>
    apiCall(`/chat/stats/${userId}`, {
      method: 'GET',
    }),
}

// Helper to manage auth token
export const tokenManager = {
  setToken: (token) => {
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
