import React, { useState, useEffect } from 'react';
import api from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { Star, Trash2 } from 'lucide-react';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const resp = await api.get('/reviews');
      setReviews(resp.data);
    } catch (err) {
      console.error("Fetch admin reviews error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      await api.delete(`/reviews/${id}`);
      fetchReviews();
    } catch (err) {
      alert("Failed to delete review.");
    }
  };

  if (loading) return <LoadingSpinner message="Fetching trek reviews database..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <div className="bg-navy-900 text-white rounded-3xl p-8 border border-navy-800">
        <span className="text-xs font-bold uppercase tracking-wider text-trek-gold">Reputation & Moderation</span>
        <h1 className="text-3xl font-extrabold mt-1">Platform Reviews</h1>
      </div>

      {reviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map(r => (
            <div key={r.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm font-bold text-navy-900">{r.user_name}</div>
                  <div className="text-xs text-slate-500">Trek: {r.trek_name}</div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-trek-gold text-xs font-bold">
                    <Star className="w-4 h-4 fill-trek-gold" />
                    <span>{r.rating}.0</span>
                  </div>
                  <button
                    onClick={() => handleDeleteReview(r.id)}
                    className="p-1 text-slate-400 hover:text-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-600 italic">"{r.comment}"</p>
              <div className="text-[10px] text-slate-400 font-mono text-right">{r.created_at?.slice(0, 10)}</div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No reviews in database"
          message="No trek reviews have been recorded in the database."
          icon={Star}
        />
      )}

    </div>
  );
}
