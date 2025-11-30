'use client';

import { useState, useEffect } from 'react';
import { Document } from '@/lib/types';
import { api } from '@/lib/api';

export default function DocsTab() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const data = await api.getDocuments();
      setDocs(data.docs || []);
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