import React, { useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { demoService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, MessageSquare, Send, FileText, Info, AlertCircle, Upload, CheckCircle, Cloud } from 'lucide-react';

const randomSessionId = () => `demo_${Math.random().toString(36).slice(2, 10)}`;

const GuestDemo = () => {
  const { user } = useAuth();
  const [sessionId] = useState(randomSessionId());
  // Samples removed: guests must upload a file to try the demo
  const [uploadedDoc, setUploadedDoc] = useState(null); // {document_id, filename}
  const [messages, setMessages] = useState([]); // {role: 'user'|'assistant', content}
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [limit, setLimit] = useState(3);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const questionsUsed = useMemo(() => messages.filter(m => m.role === 'user').length, [messages]);
  // Fixed demo limit to 3 (from backend); we can still update after first call

  // Function to parse markdown-style bold text
  const parseBoldText = (text) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.slice(2, -2);
        return <strong key={index} className="font-bold">{boldText}</strong>;
      }
      return part;
    });
  };

  // Upload handlers
  const handleUpload = useCallback(async (file) => {
    try {
      setUploading(true);
      setError('');
      const res = await demoService.uploadDemoDocument(sessionId, file);
      setUploadedDoc({ document_id: res.document_id, filename: res.filename });
    } catch (err) {
      setError('Upload failed. Ensure file type and size are allowed.');
    } finally {
      setUploading(false);
    }
  }, [sessionId]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleUpload(files[0]);
    }
  }, [handleUpload]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleAsk = async () => {
    if (!question.trim()) return;
    if (!uploadedDoc?.document_id) {
      setError('Please upload a PDF/DOCX/TXT file first.');
      return;
    }
    setError('');
    setLoading(true);
    const q = question.trim();
    setQuestion('');
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    try {
      const resp = await demoService.askDemo(q, sessionId, uploadedDoc.document_id);
      setMessages(prev => [...prev, { role: 'assistant', content: resp.answer, sources: resp.sources }]);
      if (typeof resp.limit === 'number') setLimit(resp.limit);
      if (resp.limit_reached) {
        setError(`You have reached the demo limit of ${resp.limit} questions. Register for unlimited access.`);
      }
    } catch (e) {
      setMessages(prev => prev.slice(0, -1)); // rollback user msg if failed
      setError('Failed to get demo response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const remaining = Math.max(0, limit - questionsUsed);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Link to="/guest-dashboard" className="flex items-center text-gray-500 hover:text-gray-700">
                <ArrowLeft className="h-5 w-5 mr-2" />
                <span className="text-sm">Back to Dashboard</span>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Interactive Demo</h1>
                <p className="text-sm text-gray-500">Ask up to {limit} questions using sample documents</p>
              </div>
            </div>
            <div className="text-sm text-gray-600">Guest: {user?.fullName || 'Guest'}</div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Card */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="bg-indigo-100 rounded-lg p-2 mr-3">
                  <Cloud className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Upload Document</h3>
                  <p className="text-sm text-gray-500">Upload a PDF, DOCX, or TXT file to start the demo</p>
                </div>
              </div>
              <div className="text-sm text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                {remaining}/{limit} questions remaining
              </div>
            </div>

            {!uploadedDoc ? (
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-300 ${
                  isDragOver
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                {uploading ? (
                  <div className="py-4">
                    <div className="bg-indigo-100 rounded-lg p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">Uploading...</p>
                    <p className="text-xs text-gray-500">Please wait while we process your document</p>
                  </div>
                ) : (
                  <div className="py-4">
                    <div className="bg-indigo-100 rounded-lg p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                      <Upload className="h-6 w-6 text-indigo-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">Drop your document here</p>
                    <p className="text-xs text-gray-500 mb-4">or click to browse files</p>
                    
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="demo-file-upload"
                      disabled={uploading}
                    />
                    <label
                      htmlFor="demo-file-upload"
                      className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 cursor-pointer transition-colors"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </label>
                    
                    <div className="mt-4 flex justify-center space-x-2">
                      <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                        <FileText className="h-3 w-3 mr-1" />
                        PDF
                      </span>
                      <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                        <FileText className="h-3 w-3 mr-1" />
                        DOCX
                      </span>
                      <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                        <FileText className="h-3 w-3 mr-1" />
                        TXT
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="bg-green-100 rounded-lg p-2 mr-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900">Document uploaded successfully!</p>
                    <p className="text-xs text-green-700">Using: {uploadedDoc.filename}</p>
                  </div>
                  <button
                    onClick={() => setUploadedDoc(null)}
                    className="text-green-600 hover:text-green-800 text-sm font-medium"
                  >
                    Change file
                  </button>
                </div>
              </div>
            )}

            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 mr-2" />
                <p className="text-xs text-blue-800">
                  Demo allows up to {limit} questions per session. Register for unlimited access and persistent document storage.
                </p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <p className="ml-2 text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Chat area */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 h-96 overflow-y-auto space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 text-sm">
                <MessageSquare className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                Upload a document above, then ask your first question to get started.
              </div>
            )}
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-2 rounded-lg ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                  <div className="text-sm whitespace-pre-wrap">
                    {m.content.split('\n').map((line, lineIdx) => (
                      <div key={lineIdx}>
                        {parseBoldText(line)}
                        {lineIdx < m.content.split('\n').length - 1 && <br />}
                      </div>
                    ))}
                  </div>
                  {m.sources && m.sources.length > 0 && (
                    <div className={`mt-2 text-xs ${m.role === 'user' ? 'text-indigo-100' : 'text-gray-600'}`}>
                      <div className="flex items-center">
                        <FileText className="h-3.5 w-3.5 mr-1" />
                        Sources: {m.sources.length}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={remaining === 0 ? 'Demo limit reached. Register to continue.' : (!uploadedDoc ? 'Upload a file first...' : 'Type your question...')}
                value={question}
                onChange={e => setQuestion(e.target.value)}
                disabled={loading || remaining === 0 || !uploadedDoc}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
              />
              <button
                onClick={handleAsk}
                disabled={loading || !question.trim() || remaining === 0 || !uploadedDoc}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-3 py-2 rounded-md disabled:opacity-50"
              >
                <Send className={`h-4 w-4 ${loading ? 'animate-pulse' : ''}`} />
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestDemo;


