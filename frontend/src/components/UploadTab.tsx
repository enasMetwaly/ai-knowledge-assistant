'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

export default function UploadTab() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const handleUpload = async () => {
    if (!file) {
      setMessage('Please select a file first');
      setMessageType('error');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const data = await api.uploadFile(file);
      setMessage(`✅ ${data.message} File: "${data.filename}"`);
      setMessageType('success');
      setFile(null);
      
      // Clear file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error: any) {
      setMessage(`❌ ${error.message}`);
      setMessageType('error');
    } finally {
      setUploading(false);
    }
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
              file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0
              file:text-sm file:font-semibold file:bg-gradient-to-r file:from-purple-50 file:to-blue-50
              file:text-purple-700 hover:file:bg-gradient-to-r hover:file:from-purple-100 hover:file:to-blue-100
              file:cursor-pointer cursor-pointer border-2 border-dashed border-gray-300 rounded-xl p-4
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