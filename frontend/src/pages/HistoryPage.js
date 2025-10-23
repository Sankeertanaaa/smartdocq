import React, { useState, useEffect, useCallback } from 'react';
import { History, Trash2, Calendar, MessageCircle, Clock, Eye } from 'lucide-react';
import { historyService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatRelativeTime, formatTimeOnly, parseUTCTimestamp } from '../utils/timestamp';

const HistoryPage = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to parse markdown-style bold text
  const parseBoldText = useCallback((text) => {
    // Handle undefined, null, or non-string values
    if (!text || typeof text !== 'string') {
      return text || '';
    }

    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.slice(2, -2);
        return <strong key={index} className="font-bold">{boldText}</strong>;
      }
      return part;
    });
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      const userId = user?.id || user?._id;

      if (!userId) {
        setSessions([]);
        return;
      }

      let sessions = [];

      try {
        // Try user-specific sessions first
        const response = await historyService.listUserSessions(userId);
        sessions = response.sessions || [];
      } catch (userSessionError) {
        // Fallback to general sessions and filter by user or public
        try {
          const allSessionsResp = await historyService.listSessions();
          const allSessions = allSessionsResp.sessions || [];
          // Filter sessions for current user or public sessions
          sessions = allSessions.filter(session =>
            session.user_id === userId ||
            session.user_id === user?.email ||
            session.user_id === user?.id ||
            session.is_public === true
          );
        } catch (generalError) {
          console.error('Failed to load user sessions:', generalError);
          sessions = [];
        }
      }

      setSessions(sessions);
    } catch (err) {
      setError('Failed to load chat history');
      console.error('Error loading sessions:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadSessionHistory = useCallback(async (sessionId) => {
    try {
      setLoading(true);
      const response = await historyService.getHistory(sessionId);

      // Convert the API response to the expected format
      const messages = [];
      const messageMap = new Map();

      (response.history || []).forEach(item => {
        if (item.question && !messageMap.has(`user-${item.timestamp}`)) {
          messages.push({
            type: 'user',
            content: item.question,
            timestamp: item.timestamp,
            sources: []
          });
          messageMap.set(`user-${item.timestamp}`, true);
        }

        if (item.answer && !messageMap.has(`ai-${item.timestamp}`)) {
          messages.push({
            type: 'ai',
            content: item.answer,
            timestamp: item.timestamp,
            sources: item.sources || []
          });
          messageMap.set(`ai-${item.timestamp}`, true);
        }
      });

      // Sort messages by timestamp (ensure UTC interpretation)
      messages.sort((a, b) => parseUTCTimestamp(a.timestamp) - parseUTCTimestamp(b.timestamp));

      setSessionHistory(messages);
      setSelectedSession(sessionId);
    } catch (err) {
      setError('Failed to load session history');
      console.error('Error loading session history:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteSession = useCallback(async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this session?')) {
      return;
    }

    try {
      await historyService.deleteSession(sessionId);
      if (selectedSession === sessionId) {
        setSelectedSession(null);
        setSessionHistory([]);
      }
      await loadSessions();
    } catch (err) {
      setError('Failed to delete session');
      console.error('Error deleting session:', err);
    }
  }, [selectedSession, loadSessions]);

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user, loadSessions]);

  if (loading && sessions.length === 0) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading chat history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Chat History</h1>
        <p className="text-gray-600">
          View and manage your previous conversations
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sessions List */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Sessions</h2>
              <span className="text-sm text-gray-500">
                {sessions.length} total
              </span>
            </div>

            {sessions.length === 0 ? (
              <div className="text-center py-8">
                <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No chat sessions found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.map((session) => (
                  <div
                    key={session.session_id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedSession === session.session_id
                        ? 'border-primary-300 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => loadSessionHistory(session.session_id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <MessageCircle className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {session.title || `Session ${session.session_id.slice(-8)}`}
                          </span>
                          {session.is_public && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Eye className="h-3 w-3 mr-1" />
                              Public
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span>{formatRelativeTime(session.last_activity)}</span>
                        </div>
                        <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>{session.message_count} messages</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(session.session_id);
                        }}
                        className="text-gray-400 hover:text-red-600 transition-colors p-1"
                        title="Delete session"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Session History */}
        <div className="lg:col-span-2">
          <div className="card">
            {selectedSession ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Session History
                  </h2>
                  <span className="text-sm text-gray-500">
                    {sessionHistory.length} messages
                  </span>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading messages...</p>
                  </div>
                ) : sessionHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No messages in this session</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {sessionHistory.map((message, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${
                          message.type === 'user'
                            ? 'bg-primary-50 border-primary-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-sm font-medium">
                            {message.type === 'user' ? 'You' : 'AI Assistant'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatRelativeTime(message.timestamp)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-700 leading-relaxed">
                          {parseBoldText(message.content)}
                        </div>
                        {message.sources && message.sources.length > 0 && (
                          <div className="mt-2 text-xs text-gray-500">
                            Sources: {message.sources.length} references
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a session
                </h3>
                <p className="text-gray-600">
                  Choose a session from the list to view its chat history
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryPage; 