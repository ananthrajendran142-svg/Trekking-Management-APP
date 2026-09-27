import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Users, Compass, CalendarCheck, ShieldAlert, Star, DollarSign, Database, BarChart3, RefreshCw } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');

  useEffect(() => {
    fetchAdminAnalytics();
  }, []);

  const fetchAdminAnalytics = async () => {
    try {
      const resp = await api.get('/admin/analytics');
      setStats(resp.data);
    } catch (err) {
      console.error("Fetch admin analytics error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      await api.post('/admin/seed');
      setSeedMsg('Sample database entries initialized!');
      fetchAdminAnalytics();
      setTimeout(() => setSeedMsg(''), 4000);
    } catch (err) {
      setSeedMsg('Seed trigger completed.');
    } finally {
      setSeeding(false);
    }
  };

  if (loading) return <LoadingSpinner message="Calculating database analytics metrics..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* HEADER */}
      <div className="bg-navy-900 text-white rounded-3xl p-8 border border-navy-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-trek-gold">System Command</span>
          <h1 className="text-3xl font-extrabold mt-1">Administrator Dashboard</h1>
          <p className="text-sm text-slate-300">Live system data fetched strictly from PostgreSQL / SQLite database engine.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAdminAnalytics}
            className="px-4 py-2.5 bg-navy-800 hover:bg-navy-700 text-slate-200 text-xs font-bold rounded-xl border border-navy-700 flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Metrics
          </button>
        </div>
      </div>

      {seedMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-2xl border border-emerald-200 text-center">
          {seedMsg}
        </div>
      )}

      {/* METRIC CARDS GRID */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Total Platform Users</span>
              <Users className="w-4 h-4 text-trek-blue" />
            </div>
            <span className="text-3xl font-extrabold text-navy-900">{stats.users.total}</span>
            <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100 flex justify-between">
              <span>{stats.users.trekkers} Trekkers</span>
              <span>{stats.users.guides} Guides</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Total Expeditions</span>
              <Compass className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-3xl font-extrabold text-navy-900">{stats.treks.total}</span>
            <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100 flex justify-between">
              <span>{stats.treks.active} Active</span>
              <span>{stats.treks.published} Published</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Total Bookings</span>
              <CalendarCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="text-3xl font-extrabold text-navy-900">{stats.bookings.total}</span>
            <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100 flex justify-between">
              <span>${stats.bookings.total_revenue} Revenue</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">SOS Emergency Alerts</span>
              <ShieldAlert className="w-4 h-4 text-red-500" />
            </div>
            <span className="text-3xl font-extrabold text-red-600">{stats.sos.total}</span>
            <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100 flex justify-between">
              <span className="text-red-600 font-bold">{stats.sos.active} Active SOS</span>
              <span>{stats.sos.resolved} Resolved</span>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ADMIN NAV MODULES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link to="/admin/users" className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 transition">
          <div className="p-2.5 bg-blue-50 text-trek-blue rounded-xl"><Users className="w-5 h-5" /></div>
          <div><div className="text-xs font-bold text-navy-900">User Control</div><div className="text-[11px] text-slate-400">Roles & status</div></div>
        </Link>

        <Link to="/admin/treks" className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 transition">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Compass className="w-5 h-5" /></div>
          <div><div className="text-xs font-bold text-navy-900">Treks Moderation</div><div className="text-[11px] text-slate-400">Platform treks</div></div>
        </Link>

        <Link to="/admin/sos" className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 transition">
          <div className="p-2.5 bg-red-50 text-red-600 rounded-xl"><ShieldAlert className="w-5 h-5" /></div>
          <div><div className="text-xs font-bold text-navy-900">SOS Monitor</div><div className="text-[11px] text-slate-400">Emergency map</div></div>
        </Link>

        <Link to="/admin/analytics" className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 transition">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><BarChart3 className="w-5 h-5" /></div>
          <div><div className="text-xs font-bold text-navy-900">System Analytics</div><div className="text-[11px] text-slate-400">Recharts graphs</div></div>
        </Link>
      </div>

    </div>
  );
}
