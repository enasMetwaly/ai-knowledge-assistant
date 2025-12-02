'use client';

import { useState, useEffect } from 'react';
import { User } from '@/lib/types';
import LoginPage from '@/components/LoginPage';
import Header from '@/components/Header';
import UploadTab from '@/components/UploadTab';
import ChatTab from '@/components/ChatTab';
import DocsTab from '@/components/DocsTab';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'chat' | 'docs'>('upload');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
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
        
        <Header user={user} onLogout={handleLogout} />

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
            label="Documents"
          />
        </div>

        {/* Tab Content */}
        <div className="max-w-4xl mx-auto">
          {activeTab === 'upload' && <UploadTab />}
          {activeTab === 'chat' && <ChatTab />}
          {activeTab === 'docs' && <DocsTab />}
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