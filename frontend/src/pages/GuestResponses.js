import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageSquare, 
  FileText, 
  Clock, 
  Search,
  ArrowLeft,
  RefreshCw,
  Eye
} from 'lucide-react';
import { historyService } from '../services/api';

const GuestResponses = () => {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPublicResponses();
  }, []);

  const fetchPublicResponses = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get public chat history
      const historyData = await historyService.getHistory();
      
      // Transform history into response format
      const publicResponses = [];
      const sessionMap = new Map();
      
      // Group messages by session
      historyData.history.forEach(item => {
        if (!sessionMap.has(item.session_id)) {
          sessionMap.set(item.session_id, {
            session_id: item.session_id,
            messages: [],
            last_activity: item.timestamp
          });
        }
        sessionMap.get(item.session_id).messages.push(item);
      });
      
      // Convert sessions to Q&A pairs
      sessionMap.forEach(session => {
        const messages = session.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        for (let i = 0; i < messages.length; i += 2) {
          if (i + 1 < messages.length) {
            const question = messages[i];
            const answer = messages[i + 1];
            
            if (question.role === 'user' && answer.role === 'assistant') {
              publicResponses.push({
                id: `${session.session_id}_${i}`,
                question: question.content,
                answer: answer.content,
                document: question.sources?.[0]?.document || 'Unknown Document',
                date: new Date(question.timestamp).toLocaleDateString(),
                time: new Date(question.timestamp).toLocaleTimeString(),
                session_id: session.session_id
              });
            }
          }
        }
      });
      
      // Sort by date (newest first)
      publicResponses.sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));
      
      setResponses(publicResponses);
    } catch (err) {
      console.error('Error fetching public responses:', err);
      setError('Failed to load public responses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredResponses = responses.filter(response =>
    response.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    response.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    response.document.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTimeAgo = (date, time) => {
    const now = new Date();
    const responseTime = new Date(date + ' ' + time);
    const diffInHours = Math.floor((now - responseTime) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date;
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
                <h1 className="text-3xl font-bold text-gray-900">Public Responses</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Browse questions and answers from the community
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
                  placeholder="Search responses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Showing {filteredResponses.length} of {responses.length} responses
              </div>
              <button
                onClick={fetchPublicResponses}
                disabled={loading}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading public responses...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Responses List */}
        {!loading && !error && (
          <div className="space-y-6">
            {filteredResponses.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No responses found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 'Try adjusting your search terms.' : 'No public responses are available yet.'}
                </p>
              </div>
            ) : (
              filteredResponses.map((response) => (
                <div key={response.id} className="bg-white shadow rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {response.question}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500 space-x-4">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-1" />
                          <span>{response.document}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{formatTimeAgo(response.date, response.time)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Eye className="h-4 w-4 mr-1" />
                      <span>Public</span>
                    </div>
                  </div>
                  
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed">
                      {response.answer}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Upgrade Notice */}
        <div className="mt-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Want to ask your own questions?</h3>
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

export default GuestResponses;
