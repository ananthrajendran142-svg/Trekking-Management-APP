import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { LayoutDashboard, Compass, Users, MapPin, ShieldAlert, PlusCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function GuideDashboard() {
  const { user } = useAuth();
  const [treks, setTreks] = useState([]);
  const [sosAlerts, setSosAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGuideData();
  }, []);

  const fetchGuideData = async () => {
    let loadedTreks = [];
    try {
      const [treksResp, sosResp] = await Promise.all([
        api.get('/treks', { params: { guide_id: user?.id } }).catch(() => ({ data: [] })),
        api.get('/sos').catch(() => ({ data: [] }))
      ]);
      loadedTreks = treksResp.data || [];
      setSosAlerts((sosResp.data || []).filter(a => a.status === 'active'));
    } catch (err) {
      console.warn("Guide dashboard fetch warning:", err);
    }

    try {
      const saved = localStorage.getItem('trekmate_custom_treks');
      if (saved) {
        const customTreks = JSON.parse(saved);
        customTreks.forEach(ct => {
          if (!loadedTreks.some(lt => String(lt.id) === String(ct.id) || lt.name.toLowerCase() === ct.name.toLowerCase())) {
            loadedTreks.unshift(ct);
          }
        });
      }
    } catch (e) {
      console.error(e);
    }

    setTreks(loadedTreks);
    setLoading(false);
  };

  const activeTreks = treks.filter(t => t.status === 'active');
  const publishedTreks = treks.filter(t => t.status === 'published');

  if (loading) return <LoadingSpinner message="Loading guide control center..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* HEADER */}
      <div className="bg-navy-900 text-white rounded-3xl p-8 border border-navy-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-navy-800 text-trek-gold font-semibold text-xs rounded-full border border-navy-700">
            Guide Expedition Command
          </div>
          <h1 className="text-3xl font-extrabold mt-1">Expedition Lead Portal</h1>
          <p className="text-sm text-slate-300">Manage route itineraries, rosters, live telemetry, and emergency alerts.</p>
        </div>

        <Link
          to="/guide/treks/create"
          className="px-5 py-3 bg-trek-gold hover:bg-trek-goldHover text-navy-900 font-extrabold rounded-xl shadow-lg transition text-xs flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" /> Create New Trek
        </Link>
      </div>

      {/* SOS EMERGENCY BANNER IF ACTIVE */}
      {sosAlerts.length > 0 && (
        <div className="p-4 bg-red-600 text-white rounded-2xl shadow-xl flex items-center justify-between border-2 border-red-400 animate-pulse">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-yellow-300 shrink-0" />
            <div>
              <h3 className="font-bold text-base">🚨 CRITICAL SOS ALERT ACTIVE ({sosAlerts.length})</h3>
              <p className="text-xs text-red-100">Participant emergency distress signal detected! Immediate response needed.</p>
            </div>
          </div>
          <Link
            to="/guide/sos"
            className="px-4 py-2 bg-white text-red-600 font-extrabold text-xs rounded-xl shadow hover:bg-red-50 transition"
          >
            Review SOS Map & Dispatch
          </Link>
        </div>
      )}

      {/* METRICS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-400 font-medium block">Total Managed Treks</span>
          <span className="text-2xl font-extrabold text-navy-900">{treks.length}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-400 font-medium block">Active Expeditions</span>
          <span className="text-2xl font-extrabold text-emerald-600">{activeTreks.length}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-400 font-medium block">Published & Open</span>
          <span className="text-2xl font-extrabold text-trek-blue">{publishedTreks.length}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-400 font-medium block">Active SOS Alerts</span>
          <span className="text-2xl font-extrabold text-red-600">{sosAlerts.length}</span>
        </div>
      </div>

      {/* QUICK ACTION BUTTONS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link to="/guide/treks/create" className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 transition">
          <div className="p-2.5 bg-blue-50 text-trek-blue rounded-xl"><PlusCircle className="w-5 h-5" /></div>
          <div><div className="text-xs font-bold text-navy-900">Create Trek</div><div className="text-[11px] text-slate-400">Add itinerary</div></div>
        </Link>
        <Link to="/guide/participants" className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 transition">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><Users className="w-5 h-5" /></div>
          <div><div className="text-xs font-bold text-navy-900">Rosters</div><div className="text-[11px] text-slate-400">Check-in status</div></div>
        </Link>
        <Link to="/guide/tracking" className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 transition">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><MapPin className="w-5 h-5" /></div>
          <div><div className="text-xs font-bold text-navy-900">Live Monitor</div><div className="text-[11px] text-slate-400">Telemetry pins</div></div>
        </Link>
        <Link to="/guide/sos" className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 transition">
          <div className="p-2.5 bg-red-50 text-red-600 rounded-xl"><ShieldAlert className="w-5 h-5" /></div>
          <div><div className="text-xs font-bold text-navy-900">SOS Alerts</div><div className="text-[11px] text-slate-400">Distress calls</div></div>
        </Link>
      </div>

      {/* MANAGED TREKS LIST */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-extrabold text-navy-900">Your Managed Expeditions</h2>
          <Link to="/guide/treks" className="text-xs font-bold text-trek-blue hover:underline">Manage All Treks</Link>
        </div>

        {treks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {treks.map(t => (
              <div key={t.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="px-2.5 py-1 bg-navy-900 text-trek-gold text-xs font-bold rounded-full uppercase">
                      {t.status}
                    </span>
                    <h3 className="text-lg font-bold text-navy-900 mt-2">{t.name}</h3>
                    <p className="text-xs text-slate-500">{t.location} • {t.duration}</p>
                  </div>
                  <span className="text-xs font-bold text-navy-900">${t.price}</span>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-600 pt-2 border-t border-slate-200">
                  <span>Capacity: {t.booked_count} / {t.max_participants} booked</span>
                  <Link to={`/guide/participants?trek_id=${t.id}`} className="text-trek-blue font-bold hover:underline">
                    View Roster
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No treks created yet"
            message="You haven't created any trek itineraries in the system. Click 'Create New Trek' to publish your first expedition."
            icon={Compass}
          />
        )}
      </div>

    </div>
  );
}
