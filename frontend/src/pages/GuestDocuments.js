import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Search,
  ArrowLeft,
  RefreshCw,
  Eye,
  File,
  Calendar
} from 'lucide-react';
import { uploadService, historyService } from '../services/api';

const GuestDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchPublicDocuments();
  }, []);

  const fetchPublicDocuments = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get public sessions to find which documents are actually public
      const sessionsResponse = await historyService.listSessions();
      const publicSessions = sessionsResponse.sessions.filter(session => session.is_public === true);
      
      // Collect all document IDs from public sessions
      const publicDocumentIds = new Set();
      publicSessions.forEach(session => {
        if (session.document_ids && session.document_ids.length > 0) {
          session.document_ids.forEach(docId => publicDocumentIds.add(docId));
        }
      });
      
      if (publicDocumentIds.size === 0) {
        // No public documents available
        setDocuments([]);
        setStats({ totalDocuments: 0 });
        return;
      }
      
      // Get all documents and filter for only public ones
      const documentsData = await uploadService.listDocuments();
      const allDocuments = documentsData.documents || [];
      
      // Filter documents to only include those used in public sessions
      const publicDocuments = allDocuments.filter(doc => 
        publicDocumentIds.has(doc.document_id)
      );
      
      setDocuments(publicDocuments);
      setStats({
        totalDocuments: publicDocuments.length
      });
    } catch (err) {
      console.error('Error fetching public documents:', err);
      setError('Failed to load public documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.document_id.toLowerCase().includes(searchTerm.toLowerCase())
  );


  const getFileIcon = (filename) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'txt':
        return '📃';
      case 'md':
        return '📋';
      default:
        return '📄';
    }
  };

  const getFileType = (filename) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'PDF Document';
      case 'doc':
      case 'docx':
        return 'Word Document';
      case 'txt':
        return 'Text File';
      case 'md':
        return 'Markdown File';
      default:
        return 'Document';
    }
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
                <h1 className="text-3xl font-bold text-gray-900">Public Documents</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Browse publicly available documents in the system
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
        {/* Stats Cards - Simplified for Guests */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Available Documents
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalDocuments}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Eye className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Access Level
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">Public</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Actions */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Showing {filteredDocuments.length} of {documents.length} documents
              </div>
              <button
                onClick={fetchPublicDocuments}
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
            <span className="ml-3 text-gray-600">Loading public documents...</span>
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

        {/* Documents Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No public documents found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm 
                    ? 'Try adjusting your search terms.' 
                    : 'No documents have been shared publicly yet. Public documents appear here when users make their chat sessions public.'}
                </p>
              </div>
            ) : (
              filteredDocuments.map((document) => (
                <div key={document.document_id} className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer group">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">{getFileIcon(document.filename)}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {document.filename}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {getFileType(document.filename)}
                      </p>
                      
                      <div className="mt-4">
                        <div className="flex items-center text-sm text-green-600">
                          <Eye className="h-4 w-4 mr-2" />
                          <span>Ready to explore</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <Link
                        to={`/guest/demo?doc=${document.document_id}`}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Try Demo Chat →
                      </Link>
                      <div className="flex items-center text-xs text-green-600 font-medium">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>Free Access</span>
                      </div>
                    </div>
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
              <h3 className="text-lg font-medium">Want to upload your own documents?</h3>
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

export default GuestDocuments;
