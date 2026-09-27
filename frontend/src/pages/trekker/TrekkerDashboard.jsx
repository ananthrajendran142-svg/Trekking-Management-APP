import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import SOSButton from '../../components/SOSButton';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { LayoutDashboard, CalendarCheck, MapPin, Compass, Bot, ShieldAlert, CloudSun, ArrowRight, Clock, Star, Sparkles } from 'lucide-react';

export default function TrekkerDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [bookResp, notifResp] = await Promise.all([
        api.get('/bookings'),
        api.get('/notifications')
      ]);
      setBookings(bookResp.data);
      setNotifications(notifResp.data.slice(0, 5));
    } catch (err) {
      console.error("Trekker dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const upcomingBookings = bookings.filter(b => b.booking_status === 'upcoming');
  const activeBookings = bookings.filter(b => b.booking_status === 'active');
  const completedBookings = bookings.filter(b => b.booking_status === 'completed');

  const activeTrekBooking = activeBookings[0] || upcomingBookings[0];

  if (loading) return <LoadingSpinner message="Loading your trekker dashboard..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* WELCOME BANNER */}
      <div className="bg-navy-900 text-white rounded-3xl p-6 sm:p-8 border border-navy-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-navy-800 text-trek-gold font-semibold text-xs rounded-full border border-navy-700">
            Trekker Portal
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold">Welcome back, {user?.name}!</h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Ready for your next high-altitude adventure? Monitor live telemetry and weather below.
          </p>
        </div>

        {/* SOS Quick Button */}
        <div className="shrink-0">
          <SOSButton trekId={activeTrekBooking?.trek_id} trekName={activeTrekBooking?.trek_name} />
        </div>
      </div>

      {/* COMPLETED TREK REVIEW PROMPT BANNER */}
      {completedBookings.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border border-amber-300/40 p-5 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 text-amber-800 rounded-2xl shrink-0">
              <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-navy-900 flex items-center gap-1.5">
                Completed Trek Ready for Review! <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <p className="text-xs text-slate-600">
                You completed {completedBookings.length} expedition(s). Share your feedback and 1-5 star rating now!
              </p>
            </div>
          </div>
          <Link
            to={`/trekker/reviews?trek_id=${completedBookings[0].trek_id}`}
            className="px-4 py-2 bg-navy-900 hover:bg-trek-blue text-white font-bold text-xs rounded-xl shadow transition shrink-0"
          >
            Open Review Page ⭐
          </Link>
        </div>
      )}

      {/* SUMMARY METRICS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-400 font-medium block">Upcoming Treks</span>
          <span className="text-2xl font-extrabold text-navy-900">{upcomingBookings.length}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-400 font-medium block">Active Expeditions</span>
          <span className="text-2xl font-extrabold text-emerald-600">{activeBookings.length}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-400 font-medium block">Completed Treks</span>
          <span className="text-2xl font-extrabold text-navy-900">{completedBookings.length}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-400 font-medium block">Total Bookings</span>
          <span className="text-2xl font-extrabold text-trek-blue">{bookings.length}</span>
        </div>
      </div>

      {/* QUICK ACTIONS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link to="/treks" className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 transition">
          <div className="p-2.5 bg-blue-50 text-trek-blue rounded-xl">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-navy-900">Explore Treks</div>
            <div className="text-[11px] text-slate-400">Discover routes</div>
          </div>
        </Link>

        <Link to="/trekker/bookings" className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 transition">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-navy-900">My Bookings</div>
            <div className="text-[11px] text-slate-400">View status</div>
          </div>
        </Link>

        <Link to="/trekker/tracking" className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 transition">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-navy-900">Live GPS</div>
            <div className="text-[11px] text-slate-400">Telemetry map</div>
          </div>
        </Link>

        <Link to="/ai" className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 transition">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-navy-900">AI Assistant</div>
            <div className="text-[11px] text-slate-400">RAG Q&A</div>
          </div>
        </Link>
      </div>

      {/* ACTIVE / UPCOMING TREK HIGHLIGHT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-navy-900">Active / Upcoming Expedition</h2>
              <Link to="/trekker/bookings" className="text-xs font-bold text-trek-blue hover:underline">
                View All Bookings
              </Link>
            </div>

            {activeTrekBooking ? (
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full uppercase">
                      {activeTrekBooking.booking_status}
                    </span>
                    <h3 className="text-xl font-bold text-navy-900 mt-2">{activeTrekBooking.trek_name}</h3>
                    <p className="text-xs text-slate-500 mt-1">Location: {activeTrekBooking.trek_location}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Booking ID</span>
                    <span className="text-xs font-mono font-bold text-navy-900">#{activeTrekBooking.id}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-3 border-t border-slate-200 text-slate-600">
                  <div>
                    <span className="text-slate-400 block">Departure</span>
                    <strong className="text-navy-900">{activeTrekBooking.start_date || 'Schedule pending'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Slots Booked</span>
                    <strong className="text-navy-900">{activeTrekBooking.num_participants} Person(s)</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Payment Status</span>
                    <strong className="text-emerald-600 uppercase">{activeTrekBooking.payment_status}</strong>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Link
                    to={`/treks/${activeTrekBooking.trek_id}`}
                    className="flex-1 py-2.5 bg-navy-900 hover:bg-trek-blue text-white text-xs font-bold rounded-xl text-center shadow transition"
                  >
                    View Trek Details
                  </Link>
                  <Link
                    to="/trekker/tracking"
                    className="flex-1 py-2.5 bg-trek-gold hover:bg-trek-goldHover text-navy-900 text-xs font-extrabold rounded-xl text-center shadow transition"
                  >
                    Launch Live Tracking
                  </Link>
                </div>
              </div>
            ) : (
              <EmptyState
                title="No active bookings found"
                message="You have no upcoming or active trek bookings registered in the database."
                icon={Compass}
                actionText="Explore Expeditions"
                onAction={() => window.location.href = '/treks'}
              />
            )}
          </div>
        </div>

        {/* NOTIFICATIONS PANEL */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-navy-900">Recent Notifications</h2>
            <Link to="/notifications" className="text-xs font-bold text-trek-blue hover:underline">View All</Link>
          </div>

          {notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((n) => (
                <div key={n.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <div className="text-xs font-bold text-navy-900">{n.title}</div>
                  <p className="text-[11px] text-slate-600 leading-snug">{n.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-400 py-8 text-center italic">No new notifications.</div>
          )}
        </div>

      </div>

    </div>
  );
}
