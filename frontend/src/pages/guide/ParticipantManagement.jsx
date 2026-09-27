import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { Users, CheckCircle, XCircle, Phone, Mail, User } from 'lucide-react';

export default function ParticipantManagement() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialTrekId = searchParams.get('trek_id');

  const [treks, setTreks] = useState([]);
  const [selectedTrekId, setSelectedTrekId] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGuideTreks();
  }, []);

  const fetchGuideTreks = async () => {
    let loadedTreks = [];
    try {
      const resp = await api.get('/treks');
      loadedTreks = resp.data || [];
    } catch (err) {
      console.error("Fetch guide treks error:", err);
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

    if (loadedTreks.length > 0) {
      const selectedId = initialTrekId ? initialTrekId : loadedTreks[0].id;
      setSelectedTrekId(selectedId);
      fetchParticipants(selectedId);
    }
    setLoading(false);
  };

  const fetchParticipants = async (trekId) => {
    try {
      const resp = await api.get(`/bookings/participants/${trekId}`);
      setParticipants(resp.data || []);
    } catch (err) {
      console.error("Fetch participants error:", err);
    }
  };

  const handleUpdateCheckIn = async (participantId, newStatus) => {
    try {
      await api.put(`/bookings/participants/${participantId}/status`, { check_in_status: newStatus });
      fetchParticipants(selectedTrekId);
    } catch (err) {
      alert("Failed to update check-in status.");
    }
  };

  const handleApprovePayment = async (participant) => {
    if (!participant.booking_id) return;
    setParticipants(prev => prev.map(p => p.id === participant.id ? { ...p, payment_status: 'paid' } : p));
    try {
      await api.put(`/bookings/${participant.booking_id}`, { payment_status: 'paid', booking_status: 'upcoming' });
      fetchParticipants(selectedTrekId);
    } catch (err) {
      console.error("Approve payment error:", err);
    }
  };

  if (loading) return <LoadingSpinner message="Loading expedition rosters..." />;

  const currentTrek = treks.find(t => String(t.id) === String(selectedTrekId) || t.name === selectedTrekId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* HEADER */}
      <div className="bg-navy-900 text-white rounded-3xl p-8 border border-navy-800 flex justify-between items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-trek-gold">Roster Management</span>
          <h1 className="text-3xl font-extrabold mt-1">Participant Management</h1>
        </div>

        {treks.length > 0 && (
          <select
            value={selectedTrekId || ''}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedTrekId(id);
              fetchParticipants(id);
            }}
            className="px-4 py-2.5 bg-navy-800 border border-navy-700 text-white font-bold text-xs rounded-xl"
          >
            {treks.map(t => (
              <option key={t.id} value={t.id}>{t.name} (Trek #{t.id})</option>
            ))}
          </select>
        )}
      </div>

      {/* PARTICIPANTS TABLE */}
      {participants.length > 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-slate-500">
            <span>Roster for {currentTrek?.name}</span>
            <span>Total Participants: {participants.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Participant Name</th>
                  <th className="p-4">Contact Information</th>
                  <th className="p-4">Payment Status</th>
                  <th className="p-4">Check-In Status</th>
                  <th className="p-4">Telemetry Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-navy-900 font-medium">
                {participants.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4 font-bold text-sm text-navy-900">
                      {p.user_name}
                    </td>
                    <td className="p-4 space-y-0.5 text-[11px] text-slate-600">
                      <div className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" /> {p.user_email}</div>
                      <div className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> {p.user_phone || 'N/A'}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        p.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        {p.payment_status === 'paid' ? 'APPROVED / PAID ✓' : 'PENDING APPROVAL'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        p.check_in_status === 'checked_in' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {p.check_in_status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">
                        {p.location_status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {p.payment_status !== 'paid' && p.booking_id && (
                        <button
                          onClick={() => handleApprovePayment(p)}
                          className="px-3 py-1.5 bg-trek-gold hover:bg-amber-400 text-navy-900 font-extrabold rounded-lg text-[11px] transition shadow inline-flex items-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-navy-900" /> Approve Payment
                        </button>
                      )}
                      {p.check_in_status !== 'checked_in' ? (
                        <button
                          onClick={() => handleUpdateCheckIn(p.id, 'checked_in')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] transition shadow"
                        >
                          Check In
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateCheckIn(p.id, 'pending')}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] transition"
                        >
                          Mark Pending
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          title="No registered participants"
          message="No participant bookings have been registered for this trek yet."
          icon={Users}
        />
      )}

    </div>
  );
}
