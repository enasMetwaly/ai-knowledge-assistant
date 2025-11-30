'use client';

import { useState, useEffect } from 'react';
import { ChatMessage } from '@/lib/types';
import { api } from '@/lib/api';

export default function ChatTab() {
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await api.getChatHistory();
      setChatHistory(data.history || []);
    } catch (error) {
      console.error('Failed to load chat history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleAsk = async () => {
    if (!question.trim()) return;

    setLoading(true);
    try {
      const data = await api.askQuestion(question.trim());
      
      const newMessage: ChatMessage = {
        question: question.trim(),
        answer: data.answer || 'No answer received',
        sources: data.sources || [],
        timestamp: new Date().toISOString(),
      };
      
      setChatHistory(prev => [...prev, newMessage]);
      setQuestion('');
    } catch (error: any) {
      alert(`Error: ${error.message}`);
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

              {/* Sources */}
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
            placeholder="Ask about your documents... or use @filename for specific file"
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