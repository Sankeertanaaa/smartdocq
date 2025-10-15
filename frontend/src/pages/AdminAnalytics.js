import React, { useEffect, useState } from 'react';
import { BarChart3, Star } from 'lucide-react';
import { historyService, feedbackService } from '../services/api';

const AdminAnalytics = () => {
  const [historyStats, setHistoryStats] = useState({ total_sessions: 0, total_messages: 0, average_messages_per_session: 0 });
  const [feedbackStats, setFeedbackStats] = useState({ total_feedback: 0, average_rating: 0, rating_distribution: {}, recent_feedback: [] });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const h = await historyService.getStats();
      const f = await feedbackService.getFeedbackStats();
      setHistoryStats(h);
      setFeedbackStats(f);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Usage and feedback metrics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm text-gray-500">Total Sessions</p>
          <p className="text-2xl font-semibold text-gray-900">{historyStats.total_sessions}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm text-gray-500">Total Messages</p>
          <p className="text-2xl font-semibold text-gray-900">{historyStats.total_messages}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm text-gray-500">Avg Messages / Session</p>
          <p className="text-2xl font-semibold text-gray-900">{historyStats.average_messages_per_session}</p>
        </div>
      </div>

      <div className="mt-8 bg-white shadow rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">Feedback</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-500">Total Feedback</p>
            <p className="text-2xl font-semibold text-gray-900">{feedbackStats.total_feedback}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Average Rating</p>
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-400" />
              <p className="text-2xl font-semibold text-gray-900">{feedbackStats.average_rating}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">Rating Distribution</p>
            <div className="text-sm text-gray-700">
              {Object.entries(feedbackStats.rating_distribution || {}).map(([rating, count]) => (
                <div key={rating}>⭐ {rating}: {count}</div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Recent Feedback</h3>
          <div className="space-y-2">
            {(feedbackStats.recent_feedback || []).map((f, idx) => (
              <div key={idx} className="p-3 border rounded-lg text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>Rating: {f.rating}</span>
                  <span className="text-gray-500">{new Date(f.timestamp).toLocaleString()}</span>
                </div>
                {f.comment && <div className="mt-1 text-gray-600">{f.comment}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {loading && <div className="text-center text-gray-500 mt-6">Loading...</div>}
    </div>
  );
};

export default AdminAnalytics;
