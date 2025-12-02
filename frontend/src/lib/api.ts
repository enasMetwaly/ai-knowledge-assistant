// API calls - all backend communication in one place
const API_URL = 'http://localhost:8000';

function getToken() {
  return localStorage.getItem('token');
}

export const api = {
  // Auth
  async login(email: string, password: string) {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    return response.json();
  },

  // Documents
  async uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Upload failed');
    }

    return response.json();
  },

  async getDocuments() {
    const response = await fetch(`${API_URL}/documents`, {
      headers: { 'Authorization': `Bearer ${getToken()}` },
    });

    if (!response.ok) throw new Error('Failed to fetch documents');
    return response.json();
  },

  // Chat
  async askQuestion(question: string) {
    const response = await fetch(`${API_URL}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get answer');
    }

    return response.json();
  },

  async getChatHistory() {
    const response = await fetch(`${API_URL}/chat-history`, {
      headers: { 'Authorization': `Bearer ${getToken()}` },
    });

    if (!response.ok) throw new Error('Failed to fetch history');
    return response.json();
  },
};