import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { CalendarCheck, MapPin, Clock, ArrowRight, XCircle } from 'lucide-react';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const resp = await api.get('/bookings');
      setBookings(resp.data);
    } catch (err) {
      console.error("Fetch bookings error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    try {
      await api.put(`/bookings/${bookingId}`, { booking_status: 'cancelled' });
      fetchBookings();
    } catch (err) {
      alert("Failed to cancel booking.");
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'all') return true;
    return b.booking_status === activeTab;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* HEADER */}
      <div className="bg-navy-900 text-white rounded-3xl p-8 border border-navy-800">
        <span className="text-xs font-bold uppercase tracking-wider text-trek-gold">Trekker Account</span>
        <h1 className="text-3xl font-extrabold mt-1">My Bookings</h1>
        <p className="text-sm text-slate-300">View and manage all your reserved expedition slots.</p>
      </div>

      {/* TABS */}
      <div className="flex border-b border-slate-200 space-x-2 overflow-x-auto pb-1">
        {['all', 'upcoming', 'active', 'completed', 'cancelled'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl uppercase tracking-wider transition ${activeTab === tab ? 'bg-navy-900 text-white shadow' : 'bg-white text-slate-600 hover:text-navy-900 border border-slate-200'}`}
          >
            {tab} ({tab === 'all' ? bookings.length : bookings.filter(b => b.booking_status === tab).length})
          </button>
        ))}
      </div>

      {/* BOOKINGS LIST */}
      {loading ? (
        <LoadingSpinner message="Loading your booking history..." />
      ) : filteredBookings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredBookings.map((b) => (
            <div key={b.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full uppercase ${
                    b.booking_status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                    b.booking_status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    b.booking_status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {b.booking_status}
                  </span>
                  <h3 className="text-lg font-bold text-navy-900 mt-2">{b.trek_name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-trek-blue" />
                    <span>{b.trek_location}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Booking #</span>
                  <span className="text-xs font-mono font-bold text-navy-900">TREK-{b.id}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs py-3 border-y border-slate-100 text-slate-600">
                <div>
                  <span className="text-slate-400 block">Participants</span>
                  <strong className="text-navy-900">{b.num_participants} Slot(s)</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Total Paid</span>
                  <strong className="text-navy-900">${b.total_price}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Payment Status</span>
                  <strong className="text-emerald-600 uppercase">{b.payment_status}</strong>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <Link
                  to={`/treks/${b.trek_id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-trek-blue hover:underline"
                >
                  <span>View Trek Overview</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                {b.booking_status === 'completed' && (
                  <Link
                    to={`/trekker/reviews?trek_id=${b.trek_id}`}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-lg transition flex items-center gap-1 shadow-xs"
                  >
                    <span>Rate & Review Trek ⭐</span>
                  </Link>
                )}

                {b.booking_status === 'upcoming' && (
                  <button
                    onClick={() => handleCancelBooking(b.id)}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-lg transition flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Cancel Booking
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title={`No ${activeTab !== 'all' ? activeTab : ''} bookings found`}
          message="No booking records match the selected filter category."
          icon={CalendarCheck}
        />
      )}

    </div>
  );
}
