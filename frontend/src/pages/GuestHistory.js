import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  History, 
  MessageSquare, 
  Clock, 
  Search,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { historyService } from '../services/api';

const GuestHistory = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);

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

  useEffect(() => {
    fetchPublicSessions();
  }, []);

  const fetchPublicSessions = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get all sessions
      const sessionsData = await historyService.listSessions();
      
      // Filter for public sessions only
      const publicSessions = sessionsData.sessions.filter(session => 
        session.is_public === true && session.message_count > 1 // Public and has conversations
      );
      
      setSessions(publicSessions);
    } catch (err) {
      console.error('Error fetching public sessions:', err);
      setError('Failed to load public history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionHistory = async (sessionId) => {
    try {
      // Use the shared session endpoint for public sessions
      const response = await fetch(`/api/shared/${sessionId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch session');
      }
      
      const data = await response.json();
      setSessionHistory(data.messages || []);
      setSelectedSession(sessionId);
    } catch (err) {
      console.error('Error fetching session history:', err);
      setError('Failed to load session details. This session may not be public.');
      setSessionHistory([]);
    }
  };

  const filteredSessions = sessions.filter(session =>
    session.session_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (session.title && session.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const sessionTime = new Date(timestamp);
    const diffInHours = Math.floor((now - sessionTime) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return sessionTime.toLocaleDateString();
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                to="/guest-dashboard"
                className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                <span className="text-sm">Back to Dashboard</span>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Public History</h1>
                <p className="mt-1 text-sm text-gray-500">
                  View public chat sessions and conversations
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">G</span>
                </div>
                <span className="text-sm font-medium text-gray-700">Guest</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Stats */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search sessions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Showing {filteredSessions.length} of {sessions.length} sessions
              </div>
              <button
                onClick={fetchPublicSessions}
                disabled={loading}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sessions List */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Public Sessions</h3>
                <p className="text-sm text-gray-500 mt-1">Click to view conversation</p>
              </div>
              
              {/* Loading State */}
              {loading && (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading...</span>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="p-4">
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              )}

              {/* Sessions List */}
              {!loading && !error && (
                <div className="max-h-96 overflow-y-auto">
                  {filteredSessions.length === 0 ? (
                    <div className="p-6 text-center">
                      <History className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">No public sessions found</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {filteredSessions.map((session) => (
                        <button
                          key={session.session_id}
                          onClick={() => fetchSessionHistory(session.session_id)}
                          className={`w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors ${
                            selectedSession === session.session_id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {session.title || `Session ${session.session_id.slice(0, 8)}...`}
                              </p>
                              <div className="flex items-center mt-1 text-xs text-gray-500">
                                <MessageSquare className="h-3 w-3 mr-1" />
                                <span>{session.message_count} messages</span>
                              </div>
                            </div>
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{formatTimeAgo(session.last_activity)}</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Session Details */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Conversation</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedSession ? `Session ${selectedSession.slice(0, 8)}...` : 'Select a session to view conversation'}
                </p>
              </div>
              
              <div className="p-6">
                {!selectedSession ? (
                  <div className="text-center py-12">
                    <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No session selected</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Choose a session from the list to view the conversation.
                    </p>
                  </div>
                ) : sessionHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <span className="ml-3 text-gray-600">Loading conversation...</span>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {sessionHistory.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.type === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <div className="text-sm">{parseBoldText(message.content)}</div>
                          <div className={`text-xs mt-1 ${
                            message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {formatTimestamp(message.timestamp)}
                          </div>
                          {message.sources && message.sources.length > 0 && (
                            <div className="text-xs mt-1 opacity-75">
                              Sources: {message.sources.length}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Upgrade Notice */}
        <div className="mt-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Want to start your own conversations?</h3>
              <p className="text-indigo-100 mt-1">
                Register as a student to upload documents and start your own chat sessions.
              </p>
            </div>
            <Link
              to="/register"
              className="bg-white text-indigo-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Register as Student
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestHistory;
