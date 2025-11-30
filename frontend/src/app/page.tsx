'use client';

import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:8000';

interface Document {
  name: string;
  chunks: number;
  embedding_count: number;
}

interface Source {
  content: string;
  filename: string;
}

interface ChatMessage {
  question: string;
  answer: string;
  sources: Source[];
  timestamp?: string;
}

interface User {
  user_id: string;
  email: string;
  name: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'chat' | 'docs'>('upload');
  const [loading, setLoading] = useState(true);
  
  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">🧠</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        
        {/* Header with User Info */}
        <header className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex-1" />
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Logged in as</p>
                <p className="font-semibold text-gray-800">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition shadow-md"
              >
                🚪 Logout
              </button>
            </div>
          </div>
          
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-3">
            🧠 Nixai AI Assistant
          </h1>
          <p className="text-gray-600 text-lg">
            Powered by <span className="font-semibold text-purple-600">Groq LLM</span> ⚡
          </p>
        </header>

        {/* Navigation Tabs */}
        <div className="flex justify-center gap-3 mb-8">
          <TabButton
            active={activeTab === 'upload'}
            onClick={() => setActiveTab('upload')}
            icon="📁"
            label="Upload"
          />
          <TabButton
            active={activeTab === 'chat'}
            onClick={() => setActiveTab('chat')}
            icon="💬"
            label="Chat"
          />
          <TabButton
            active={activeTab === 'docs'}
            onClick={() => setActiveTab('docs')}
            icon="📚"
            label="My Documents"
          />
        </div>

        {/* Content Area */}
        <div className="max-w-4xl mx-auto">
          {activeTab === 'upload' && <UploadTab />}
          {activeTab === 'chat' && <ChatTab />}
          {activeTab === 'docs' && <DocsTab />}
        </div>

        {/* Footer */}
        <footer className="text-center mt-16 text-gray-500 text-sm">
          Built for Nixai Labs Hiring Challenge 🚀 | Groq-Powered AI ⚡
        </footer>
      </div>
    </div>
  );
}

function LoginPage({ onLogin }: { onLogin: (user: User) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.access_token);
        // Handle both flat and nested user object structure
        const userData = {
          user_id: data.user?.user_id || data.user_id,
          email: data.user?.email || data.email,
          name: data.user?.name || data.name,
        };
        localStorage.setItem('user', JSON.stringify(userData));
        onLogin(userData);
      } else {
        setError(data.detail || 'Login failed');
      }
    } catch (err) {
      setError('Cannot connect to server. Make sure backend is running on port 8000!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-3">
            🧠 Nixai AI Assistant
          </h1>
          <p className="text-gray-600">Please login to continue</p>
          <p className="text-sm text-purple-600 mt-2">⚡ Powered by Groq LLM</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Login</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-800 rounded-xl border border-red-200">
                ❌ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 transition-all shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span> Logging in...
                </span>
              ) : (
                '🔐 Login'
              )}
            </button>
          </form>

          <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
            <p className="text-sm text-gray-700 font-semibold mb-2">💡 Demo Accounts:</p>
            <div className="space-y-1">
              <p className="text-xs text-gray-600">📧 user@example.com / 🔑 password123</p>
              <p className="text-xs text-gray-600">📧 admin@nixai.com / 🔑 admin123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-md ${
        active
          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white scale-105 shadow-lg'
          : 'bg-white text-gray-700 hover:bg-gray-50 hover:scale-102'
      }`}
    >
      <span className="mr-2">{icon}</span>
      {label}
    </button>
  );
}

function UploadTab() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const handleUpload = async () => {
    if (!file) {
      showMessage('Please select a file first', 'error');
      return;
    }

    setUploading(true);
    setMessage('');

    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        showMessage(
          `✅ ${data.message || 'Success!'} File: "${data.filename}"`,
          'success'
        );
        setFile(null);
        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        showMessage(`❌ Error: ${data.detail || 'Upload failed'}`, 'error');
      }
    } catch (error) {
      showMessage('❌ Connection failed. Make sure backend is running on port 8000!', 'error');
    } finally {
      setUploading(false);
    }
  };

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">📁 Upload Documents</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Select a PDF or TXT file
          </label>
          <input
            id="file-input"
            type="file"
            accept=".pdf,.txt"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-600
              file:mr-4 file:py-3 file:px-6
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-gradient-to-r file:from-purple-50 file:to-blue-50
              file:text-purple-700
              hover:file:bg-gradient-to-r hover:file:from-purple-100 hover:file:to-blue-100
              file:cursor-pointer cursor-pointer
              border-2 border-dashed border-gray-300 rounded-xl p-4
              hover:border-purple-400 transition"
          />
        </div>

        {file && (
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <span className="text-2xl">📄</span>
            <div className="flex-1">
              <p className="font-medium text-gray-800">{file.name}</p>
              <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
            </div>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={uploading || !file}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-semibold text-lg
            hover:from-purple-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 
            disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl
            disabled:shadow-none transform hover:scale-[1.02] disabled:scale-100"
        >
          {uploading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span> Processing...
            </span>
          ) : (
            '📤 Upload & Process'
          )}
        </button>

        {message && (
          <div className={`p-4 rounded-xl font-medium animate-fade-in ${
            messageType === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
          <p className="text-sm text-gray-700">
            <strong>🔒 Private:</strong> Your documents are only visible to you<br/>
            <strong>⚡ Powered by:</strong> Groq LLM (llama-3.1-8b-instant)<br/>
            <strong>🔄 Background Processing:</strong> Files process asynchronously for instant upload
          </p>
        </div>
      </div>
    </div>
  );
}

function ChatTab() {
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Load chat history when component mounts
  useEffect(() => {
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    setLoadingHistory(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_URL}/chat-history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setChatHistory(data.history || []);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleAsk = async () => {
    if (!question.trim()) return;

    setLoading(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_URL}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ question: question.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        const newMessage: ChatMessage = {
          question: question.trim(),
          answer: data.answer || 'No answer received',
          sources: data.sources || [],
          timestamp: new Date().toISOString(),
        };
        
        // Add to local state
        setChatHistory(prev => [...prev, newMessage]);
        
        // Clear input
        setQuestion('');
      } else {
        alert(`Error: ${data.detail || 'Failed to get answer'}`);
      }
    } catch (error) {
      alert('Connection failed. Make sure backend is running!');
      console.error('Ask error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-800">💬 Chat with AI</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-semibold">
            ⚡ Groq LLM
          </span>
          {chatHistory.length > 0 && (
            <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">
              {chatHistory.length} messages
            </span>
          )}
        </div>
      </div>

      {/* Chat History */}
      {loadingHistory ? (
        <div className="text-center py-8">
          <div className="animate-spin text-3xl mb-2">⏳</div>
          <p className="text-gray-500 text-sm">Loading chat history...</p>
        </div>
      ) : chatHistory.length > 0 ? (
        <div className="mb-6 max-h-96 overflow-y-auto space-y-4 p-4 bg-gray-50 rounded-xl">
          {chatHistory.map((msg, idx) => (
            <div key={idx} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              {/* Question */}
              <div className="mb-3">
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-lg">👤</span>
                  <p className="font-semibold text-gray-800">{msg.question}</p>
                </div>
              </div>
              
              {/* Answer */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-lg">🤖</span>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{msg.answer}</p>
                </div>
              </div>

              {/* Sources - Expandable Viewer */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-4 border-t border-gray-200 pt-3">
                  <details className="group">
                    <summary className="cursor-pointer list-none flex items-center justify-between p-3 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📚</span>
                        <span className="font-semibold text-gray-700">
                          View Source Documents ({msg.sources.length})
                        </span>
                      </div>
                      <span className="text-gray-400 group-open:rotate-180 transition-transform">
                        ▼
                      </span>
                    </summary>
                    <div className="mt-3 space-y-3">
                      {msg.sources.map((src, i) => (
                        <div key={i} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                          <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-4 py-2 flex justify-between items-center border-b border-gray-200">
                            <span className="text-sm font-semibold text-purple-700">
                              📄 {src.filename}
                            </span>
                            <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                              Source {i + 1}
                            </span>
                          </div>
                          <div className="p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                            {src.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 mb-6 text-gray-400 bg-gray-50 rounded-xl">
          <div className="text-4xl mb-2">💭</div>
          <p>No chat history yet. Ask your first question!</p>
        </div>
      )}

      {/* Input Area */}
      <div className="space-y-4">
        <div>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about your documents..."
            rows={3}
            className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-2 
              focus:ring-purple-500 focus:border-transparent transition resize-none
              text-gray-800 placeholder-gray-400"
            disabled={loading}
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-500">
              💡 Press <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Enter</kbd> to send
            </p>
            <p className="text-xs text-gray-400">
              💡 Tip: Use <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">@filename</kbd> to search specific file
            </p>
          </div>
        </div>

        <button
          onClick={handleAsk}
          disabled={loading || !question.trim()}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-semibold text-lg
            hover:from-purple-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400
            disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl
            transform hover:scale-[1.02] disabled:scale-100"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">🤔</span> AI is thinking...
            </span>
          ) : (
            '🚀 Send Message'
          )}
        </button>
      </div>
    </div>
  );
}

function DocsTab() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);

  const loadDocs = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${API_URL}/documents`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setDocs(data.docs || []);
      } else {
        console.error('Failed to load documents');
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">📚 My Documents</h2>
        <button
          onClick={loadDocs}
          disabled={loading}
          className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg 
            hover:from-purple-700 hover:to-blue-700 font-medium transition-all shadow-md hover:shadow-lg
            disabled:from-gray-300 disabled:to-gray-400"
        >
          {loading ? '⏳' : '🔄'} Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-500">Loading your documents...</p>
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-gray-500 text-lg font-medium">No documents uploaded yet</p>
          <p className="text-gray-400 text-sm mt-2">Upload your first document to get started!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map((doc, idx) => (
            <div 
              key={idx} 
              className="border-2 border-gray-200 rounded-xl p-5 hover:border-purple-300 
                hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all
                group"
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl group-hover:scale-110 transition-transform">
                  {doc.name.endsWith('.pdf') ? '📕' : '📄'}
                </span>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg">{doc.name}</h3>
                  <div className="flex gap-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <span>📊</span> {doc.chunks} chunks
                    </span>
                    <span className="flex items-center gap-1">
                      <span>🔢</span> {doc.embedding_count} embeddings
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}