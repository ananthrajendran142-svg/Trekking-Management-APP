import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { Compass, Edit, Trash2, Users, Play, CheckCircle, XCircle } from 'lucide-react';

export default function ManageTreks() {
  const { user } = useAuth();
  const [treks, setTreks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTreks();
    const handleUpdate = () => fetchTreks();
    window.addEventListener('trekmate_treks_updated', handleUpdate);
    window.addEventListener('focus', handleUpdate);
    return () => {
      window.removeEventListener('trekmate_treks_updated', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
    };
  }, []);

  const fetchTreks = async () => {
    let loadedTreks = [];
    try {
      const resp = await api.get('/treks', { params: { guide_id: user?.id } });
      loadedTreks = resp.data || [];
    } catch (err) {
      console.warn("Fetch managed treks warning, falling back to local:", err);
    }

    try {
      const saved = localStorage.getItem('trekmate_custom_treks');
      if (saved) {
        const customTreks = JSON.parse(saved);
        customTreks.forEach(ct => {
          const idx = loadedTreks.findIndex(lt => String(lt.id) === String(ct.id) || lt.name.toLowerCase() === ct.name.toLowerCase());
          if (idx !== -1) {
            loadedTreks[idx] = { ...loadedTreks[idx], ...ct };
          } else {
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

  const handleStatusChange = async (trekId, newStatus) => {
    // 1. Immediately update UI state & local storage
    setTreks(prev => prev.map(t => String(t.id) === String(trekId) ? { ...t, status: newStatus } : t));
    try {
      const saved = localStorage.getItem('trekmate_custom_treks');
      if (saved) {
        let list = JSON.parse(saved);
        list = list.map(t => String(t.id) === String(trekId) ? { ...t, status: newStatus } : t);
        localStorage.setItem('trekmate_custom_treks', JSON.stringify(list));
      }
      window.dispatchEvent(new Event('trekmate_treks_updated'));
    } catch (e) {
      console.error(e);
    }

    // 2. Notify backend
    try {
      await api.put(`/treks/${trekId}/status`, { status: newStatus });
      window.dispatchEvent(new Event('trekmate_treks_updated'));
    } catch (err) {
      console.warn("Backend status change warning, proceeding with local state:", err);
    }
  };

  const handleDeleteTrek = async (trekId) => {
    if (!window.confirm("Are you sure you want to delete this trek?")) return;
    try {
      await api.delete(`/treks/${trekId}`);
      fetchTreks();
    } catch (err) {
      alert("Delete trek failed.");
    }
  };

  if (loading) return <LoadingSpinner message="Loading your treks..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* HEADER */}
      <div className="bg-navy-900 text-white rounded-3xl p-8 border border-navy-800 flex justify-between items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-trek-gold">Expedition Operations</span>
          <h1 className="text-3xl font-extrabold mt-1">Manage Treks</h1>
        </div>

        <Link
          to="/guide/treks/create"
          className="px-4 py-2.5 bg-trek-gold hover:bg-trek-goldHover text-navy-900 font-bold text-xs rounded-xl shadow transition"
        >
          Create New Trek
        </Link>
      </div>

      {/* TREKS TABLE / CARDS */}
      {treks.length > 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Expedition</th>
                  <th className="p-4">Difficulty & Duration</th>
                  <th className="p-4">Capacity</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-navy-900 font-medium">
                {treks.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4">
                      <div className="font-bold text-sm text-navy-900">{t.name}</div>
                      <div className="text-[11px] text-slate-400">{t.location}</div>
                    </td>
                    <td className="p-4">
                      <div>{t.difficulty}</div>
                      <div className="text-[11px] text-slate-400">{t.duration}</div>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-trek-blue">{t.booked_count}</span> / {t.max_participants}
                    </td>
                    <td className="p-4 font-bold">${t.price}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        t.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                        t.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        t.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {t.status === 'published' && (
                        <button
                          onClick={() => handleStatusChange(t.id, 'active')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] transition"
                        >
                          Start Trek
                        </button>
                      )}
                      {t.status === 'active' && (
                        <button
                          onClick={() => handleStatusChange(t.id, 'completed')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[11px] transition"
                        >
                          End Trek
                        </button>
                      )}
                      <Link
                        to={`/guide/treks/${t.id}/edit`}
                        className="p-1.5 text-slate-400 hover:text-trek-blue rounded-lg transition inline-block"
                        title="Edit Trek"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDeleteTrek(t.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition"
                        title="Delete Trek"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          title="No Managed Treks Found"
          message="You have no published or active treks registered in your guide account."
          icon={Compass}
        />
      )}

    </div>
  );
}
