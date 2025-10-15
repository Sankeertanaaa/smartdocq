import React, { useEffect, useState } from 'react';
import { FileText, RefreshCcw, Layers } from 'lucide-react';
import { uploadService } from '../services/api';

const AdminDocuments = () => {
  const [stats, setStats] = useState({ total_chunks: 0, collection_name: '' });
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const resp = await uploadService.listDocuments();
      setStats({
        total_chunks: resp.total_chunks || 0,
        collection_name: resp.collection_name || 'smartdoc_chunks',
      });
      setDocuments(resp.documents || []);
    } catch (e) {
      setError('Failed to load document stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Library</h1>
          <p className="text-gray-600">Overview of embedded document chunks</p>
        </div>
        <button onClick={load} className="btn-secondary flex items-center space-x-2">
          <RefreshCcw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-100 p-3 rounded-lg">
              <FileText className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Chunks</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total_chunks}</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm text-gray-500">Collection</p>
          <p className="text-lg font-medium text-gray-900">{stats.collection_name}</p>
        </div>
      </div>

      {loading && (
        <div className="text-center text-gray-500 mt-8">Loading...</div>
      )}

      {!loading && (
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center space-x-2">
            <Layers className="h-4 w-4 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
          </div>
          <div className="p-6">
            {documents.length === 0 ? (
              <div className="text-gray-500">No documents indexed yet.</div>
            ) : (
              <div className="space-y-3">
                {documents.map((d) => (
                  <div key={d.document_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{d.filename || d.document_id}</div>
                      <div className="text-xs text-gray-500">ID: {d.document_id}</div>
                    </div>
                    <div className="text-sm text-gray-600">{d.chunk_count} chunks</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDocuments;
