import React, { useState, useEffect } from 'react';
import api from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { CalendarCheck, Search } from 'lucide-react';

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const resp = await api.get('/bookings', { params: { status: statusFilter } });
      setBookings(resp.data);
    } catch (err) {
      console.error("Fetch admin bookings error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* HEADER */}
      <div className="bg-navy-900 text-white rounded-3xl p-8 border border-navy-800 flex justify-between items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-trek-gold">Global Registry</span>
          <h1 className="text-3xl font-extrabold mt-1">Bookings Registry</h1>
        </div>

        <div className="flex gap-2">
          {['all', 'upcoming', 'active', 'completed', 'cancelled'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl uppercase transition ${statusFilter === st ? 'bg-trek-gold text-navy-900' : 'bg-navy-800 text-slate-300'}`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Fetching global booking records..." />
      ) : bookings.length > 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Booking ID</th>
                  <th className="p-4">Trek</th>
                  <th className="p-4">Trekker</th>
                  <th className="p-4">Slots & Total</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-navy-900 font-medium">
                {bookings.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4 font-mono font-bold text-slate-500">#{b.id}</td>
                    <td className="p-4 font-bold text-navy-900">{b.trek_name}</td>
                    <td className="p-4">
                      <div>{b.user_name}</div>
                      <div className="text-[11px] text-slate-400">{b.user_email}</div>
                    </td>
                    <td className="p-4">
                      <div>{b.num_participants} Slot(s)</div>
                      <div className="font-bold text-trek-gold">${b.total_price}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-[10px] font-bold uppercase">
                        {b.booking_status}
                      </span>
                    </td>
                    <td className="p-4 text-emerald-600 font-bold uppercase">{b.payment_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          title="No bookings recorded"
          message="No global bookings exist in the database matching this status filter."
          icon={CalendarCheck}
        />
      )}

    </div>
  );
}
