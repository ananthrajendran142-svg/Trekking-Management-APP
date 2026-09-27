import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { Compass, Trash2, Edit } from 'lucide-react';

export default function AdminTrekManagement() {
  const [treks, setTreks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTreks();
  }, []);

  const fetchTreks = async () => {
    try {
      const resp = await api.get('/treks');
      setTreks(resp.data);
    } catch (err) {
      console.error("Fetch admin treks error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.put(`/treks/${id}/status`, { status: newStatus });
      fetchTreks();
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  const handleDeleteTrek = async (id) => {
    if (!window.confirm("Are you sure you want to delete this trek?")) return;
    try {
      await api.delete(`/treks/${id}`);
      fetchTreks();
    } catch (err) {
      alert("Failed to delete trek.");
    }
  };

  if (loading) return <LoadingSpinner message="Fetching platform treks catalog..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="bg-navy-900 text-white rounded-3xl p-8 border border-navy-800">
        <span className="text-xs font-bold uppercase tracking-wider text-trek-gold">Platform Moderation</span>
        <h1 className="text-3xl font-extrabold mt-1">Global Treks Moderation</h1>
      </div>

      {treks.length > 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Trek & Location</th>
                  <th className="p-4">Assigned Guide</th>
                  <th className="p-4">Difficulty & Price</th>
                  <th className="p-4">Capacity</th>
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
                    <td className="p-4 text-slate-600">{t.guide_name}</td>
                    <td className="p-4">
                      <div>{t.difficulty}</div>
                      <div className="font-bold text-trek-gold">${t.price}</div>
                    </td>
                    <td className="p-4 font-bold">{t.booked_count} / {t.max_participants}</td>
                    <td className="p-4">
                      <select
                        value={t.status}
                        onChange={(e) => handleStatusChange(t.id, e.target.value)}
                        className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-navy-900"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Link
                        to={`/guide/treks/${t.id}/edit`}
                        className="p-1.5 text-slate-400 hover:text-trek-blue transition inline-block"
                        title="Edit Trek"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDeleteTrek(t.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 transition"
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
          title="No treks in database"
          message="No expeditions exist in the system database."
          icon={Compass}
        />
      )}
    </div>
  );
}
