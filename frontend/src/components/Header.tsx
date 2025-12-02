'use client';

import { User } from '@/lib/types';

interface HeaderProps {
  user: User;
  onLogout: () => void;
}

export default function Header({ user, onLogout }: HeaderProps) {
  return (
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
            onClick={onLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition shadow-md"
          >
            🚪 Logout
          </button>
        </div>
      </div>
      
      <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-3">
        🧠 Knowledge AI Assistant
      </h1>
      <p className="text-gray-600 text-lg">
        Powered by <span className="font-semibold text-purple-600">Groq LLM</span> ⚡
      </p>
    </header>
  );
}