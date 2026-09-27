import React, { useState, useEffect } from 'react';
import api from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { Bell, CheckCheck, ShieldAlert, CalendarCheck, CloudSun } from 'lucide-react';

export default function TrekkerNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const resp = await api.get('/notifications');
      setNotifications(resp.data);
    } catch (err) {
      console.error("Fetch notifications error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      console.error("Mark all read error:", err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      
      {/* HEADER */}
      <div className="bg-navy-900 text-white rounded-3xl p-6 border border-navy-800 flex justify-between items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-trek-gold">Alerts Center</span>
          <h1 className="text-2xl font-extrabold">Notifications</h1>
        </div>
        
        {notifications.length > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 bg-navy-800 hover:bg-navy-700 text-trek-gold text-xs font-bold rounded-xl border border-navy-700 flex items-center gap-1.5 transition"
          >
            <CheckCheck className="w-4 h-4" /> Mark All as Read
          </button>
        )}
      </div>

      {/* NOTIFICATIONS LIST */}
      {loading ? (
        <LoadingSpinner message="Fetching notifications..." />
      ) : notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-5 rounded-2xl border shadow-sm transition flex items-start gap-4 ${
                !n.read_status ? 'bg-white border-trek-blue/40 border-l-4 border-l-trek-blue' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="p-2.5 bg-navy-900 text-trek-gold rounded-xl shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start">
                  <h3 className="text-sm font-bold text-navy-900">{n.title}</h3>
                  <span className="text-[10px] text-slate-400 font-mono">{n.created_at?.slice(0, 10)}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No notifications"
          message="You have no notifications or security alerts at this time."
          icon={Bell}
        />
      )}

    </div>
  );
}
