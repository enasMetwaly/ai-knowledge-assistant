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

export default function Home() {
  const [activeTab, setActiveTab] = useState<'upload' | 'chat' | 'docs'>('upload');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-3">
            🧠 Nixai AI Assistant
          </h1>
          <p className="text-gray-600 text-lg">Upload documents, ask questions, get AI-powered answers</p>
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
            label="Ask Question"
          />
          <TabButton
            active={activeTab === 'docs'}
            onClick={() => setActiveTab('docs')}
            icon="📚"
            label="Documents"
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
          Built for Nixai Labs Hiring Challenge 🚀
        </footer>
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

    try {
      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        showMessage(
          `✅ Success! Processed ${data.chunks} chunks from "${data.filename}"`,
          'success'
        );
        setFile(null);
        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        showMessage(`❌ Error: ${data.detail || 'Upload failed'}`, 'error');
      }
    } catch (error) {
      showMessage('❌ Failed to upload. Make sure the backend is running on port 8000!', 'error');
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
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
            <span className="text-2xl">📄</span>
            <div>
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

        <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-sm text-gray-600">
            💡 <strong>Tip:</strong> Supported formats: PDF, TXT. Files are processed using HuggingFace embeddings (no API key needed!)
          </p>
        </div>
      </div>
    </div>
  );
}

function ChatTab() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSources, setShowSources] = useState(false);

  const handleAsk = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setAnswer('');
    setSources([]);
    setShowSources(false);

    try {
      const response = await fetch(`${API_URL}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });

      const data = await response.json();

      if (response.ok) {
        setAnswer(data.answer);
        setSources(data.sources || []);
      } else {
        setAnswer(`❌ Error: ${data.detail || 'Failed to get answer'}`);
      }
    } catch (error) {
      setAnswer('❌ Failed to connect. Make sure the backend is running!');
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
      <h2 className="text-3xl font-bold mb-6 text-gray-800">💬 Ask a Question</h2>

      <div className="space-y-6">
        <div>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="What would you like to know about your documents?"
            rows={4}
            className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-2 
              focus:ring-purple-500 focus:border-transparent transition resize-none
              text-gray-800 placeholder-gray-400"
          />
          <p className="text-xs text-gray-500 mt-2">Press Enter to submit, Shift+Enter for new line</p>
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
              <span className="animate-spin">🤔</span> Thinking...
            </span>
          ) : (
            '🚀 Get Answer'
          )}
        </button>

        {answer && (
          <div className="mt-8 space-y-4 animate-fade-in">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl border border-purple-200">
              <h3 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                <span>💡</span> Answer:
              </h3>
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{answer}</p>
            </div>

            {sources.length > 0 && (
              <div>
                <button
                  onClick={() => setShowSources(!showSources)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 
                    rounded-xl transition border border-gray-200"
                >
                  <span className="font-semibold text-gray-700">
                    📚 View Sources ({sources.length})
                  </span>
                  <span className="text-gray-500">{showSources ? '▲' : '▼'}</span>
                </button>

                {showSources && (
                  <div className="mt-3 space-y-3">
                    {sources.map((source, idx) => (
                      <div key={idx} className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                        <p className="text-sm text-gray-600 leading-relaxed">{source.content}</p>
                        <p className="text-xs text-gray-400 mt-2">From: {source.filename}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DocsTab() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/docs`);
      const data = await response.json();
      setDocs(data.docs || []);
    } catch (error) {
      console.error('Failed to load documents');
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
        <h2 className="text-3xl font-bold text-gray-800">📚 Uploaded Documents</h2>
        <button
          onClick={loadDocs}
          className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg 
            hover:from-purple-700 hover:to-blue-700 font-medium transition-all shadow-md hover:shadow-lg"
        >
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-500">Loading documents...</p>
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-gray-500 text-lg">No documents uploaded yet</p>
          <p className="text-gray-400 text-sm mt-2">Upload your first document to get started!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map((doc, idx) => (
            <div 
              key={idx} 
              className="border-2 border-gray-200 rounded-xl p-5 hover:border-purple-300 
                hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all
                cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl group-hover:scale-110 transition-transform">📄</span>
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