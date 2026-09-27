import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { Star, CheckCircle2, Lock, Award, MessageSquare, Compass, Send, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';

export default function TrekkerReviews() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const targetTrekId = searchParams.get('trek_id') ? parseInt(searchParams.get('trek_id')) : null;

  const [bookings, setBookings] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form states per trek_id: { [trek_id]: { rating: 5, comment: '' } }
  const [forms, setForms] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bookingsResp, reviewsResp] = await Promise.all([
        api.get('/bookings'),
        api.get('/reviews/my')
      ]);

      const bkList = bookingsResp.data || [];
      const revList = reviewsResp.data || [];

      setBookings(bkList);
      setMyReviews(revList);

      // Populate form initial state with existing reviews
      const initialForms = {};
      bkList.forEach(b => {
        const existingRev = revList.find(r => r.trek_id === b.trek_id);
        initialForms[b.trek_id] = {
          rating: existingRev ? existingRev.rating : 5,
          comment: existingRev ? existingRev.comment : ''
        };
      });
      setForms(initialForms);
    } catch (err) {
      console.error("Fetch reviews data error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (trekId, newRating) => {
    setForms(prev => ({
      ...prev,
      [trekId]: { ...prev[trekId], rating: newRating }
    }));
  };

  const handleCommentChange = (trekId, text) => {
    setForms(prev => ({
      ...prev,
      [trekId]: { ...prev[trekId], comment: text }
    }));
  };

  const handleSubmitReview = async (e, trekId) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    const form = forms[trekId];
    if (!form || !form.comment.trim()) {
      setErrorMsg('Please enter a review comment before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const resp = await api.post('/reviews', {
        trek_id: trekId,
        rating: form.rating,
        comment: form.comment.trim()
      });

      setSuccessMsg(resp.data.message || 'Review submitted successfully!');
      fetchData();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading completed trek review forms..." />;

  const completedBookings = bookings.filter(b => b.booking_status === 'completed');
  const targetBooking = targetTrekId ? bookings.find(b => b.trek_id === targetTrekId) : null;
  const isTargetCompleted = targetBooking && targetBooking.booking_status === 'completed';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* HEADER BANNER */}
      <div className="bg-navy-900 text-white rounded-3xl p-8 border border-navy-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-navy-800 text-trek-gold font-semibold text-xs rounded-full border border-navy-700">
            <Award className="w-3.5 h-3.5" /> Verified Trekker Experience
          </div>
          <h1 className="text-3xl font-extrabold">Trek Reviews & Ratings</h1>
          <p className="text-xs text-slate-300">
            Review page and 1-5 star ratings open strictly after completion of your trek expedition.
          </p>
        </div>

        <Link
          to="/trekker/bookings"
          className="px-4 py-2 bg-navy-800 hover:bg-navy-700 text-slate-200 hover:text-white border border-navy-700 font-bold text-xs rounded-xl transition"
        >
          View All Bookings
        </Link>
      </div>

      {/* NOTIFICATION MESSAGES */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-900 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs">
          <Lock className="w-4 h-4 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* WARNING IF TARGET TREK IS NOT COMPLETED YET */}
      {targetBooking && !isTargetCompleted && (
        <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h4 className="font-bold">Review Locked for "{targetBooking.trek_name}"</h4>
            <p>
              This trek is currently in <strong>{targetBooking.booking_status.toUpperCase()}</strong> status. Review forms and 1-5 star ratings open automatically after the guide completes the trek.
            </p>
          </div>
        </div>
      )}

      {/* COMPLETED TREKS SECTION - EXCLUSIVELY COMPLETED TREKS */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 className="text-lg font-extrabold text-navy-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Completed Expeditions ({completedBookings.length})
          </h2>
          <span className="text-xs text-slate-500 font-medium">Ratings & Review Form Unlocked</span>
        </div>

        {completedBookings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {completedBookings.map(b => {
              const existingRev = myReviews.find(r => r.trek_id === b.trek_id);
              const form = forms[b.trek_id] || { rating: 5, comment: '' };
              const isSelected = targetTrekId === b.trek_id;

              return (
                <div
                  key={b.id}
                  className={`bg-white rounded-3xl border ${isSelected ? 'border-trek-blue ring-2 ring-trek-blue/20' : 'border-slate-200'} shadow-md p-6 space-y-4 transition`}
                >
                  <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase">
                        Trek Completed ✓
                      </span>
                      <h3 className="text-base font-extrabold text-navy-900 mt-1">{b.trek_name}</h3>
                      <p className="text-xs text-slate-500">📍 {b.trek_location}</p>
                    </div>

                    {existingRev && (
                      <span className="text-[10px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500" /> Reviewed
                      </span>
                    )}
                  </div>

                  {/* Star Rating Selector */}
                  <form onSubmit={(e) => handleSubmitReview(e, b.trek_id)} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-navy-900 block">Star Rating:</label>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => handleRatingChange(b.trek_id, star)}
                            className="p-1 hover:scale-110 transition focus:outline-none"
                          >
                            <Star
                              className={`w-6 h-6 ${
                                star <= form.rating
                                  ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                                  : 'text-slate-300'
                              }`}
                            />
                          </button>
                        ))}
                        <span className="ml-2 text-xs font-bold text-navy-900">{form.rating} / 5 Stars</span>
                      </div>
                    </div>

                    {/* Comment Textarea */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-navy-900 block">Expedition Review:</label>
                      <textarea
                        rows="3"
                        placeholder="Share details about the route, guide assistance, safety measures, and overall experience..."
                        value={form.comment}
                        onChange={(e) => handleCommentChange(b.trek_id, e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-navy-900 focus:outline-none focus:border-trek-blue"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-2.5 bg-navy-900 hover:bg-trek-blue text-white text-xs font-extrabold rounded-xl shadow transition flex items-center justify-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5 text-trek-gold" />
                      <span>{existingRev ? 'Update My Review' : 'Submit Review & Rating'}</span>
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center mx-auto text-amber-600">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-extrabold text-navy-900">Review Form Opens Upon Trek Completion</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                You currently have no completed treks. Review forms and 1-5 star rating submissions unlock automatically once your guide finishes your expedition.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/trekker/bookings"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy-900 hover:bg-trek-blue text-white font-bold text-xs rounded-xl shadow transition"
              >
                <Compass className="w-4 h-4 text-trek-gold" />
                <span>Check My Bookings</span>
              </Link>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

