import React, { useState, useEffect } from 'react';
import api from '../../api';
import TrekMap from '../../components/TrekMap';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function AdminSOSMonitoring() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(null);

  useEffect(() => {
    fetchSOSAlerts();
  }, []);

  const fetchSOSAlerts = async () => {
    try {
      const resp = await api.get('/sos');
      setAlerts(resp.data);
      if (resp.data.length > 0) setSelectedAlert(resp.data[0]);
    } catch (err) {
      console.error("Fetch SOS error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveAlert = async (id) => {
    try {
      await api.put(`/sos/${id}/resolve`);
      fetchSOSAlerts();
    } catch (err) {
      alert("Failed to resolve SOS.");
    }
  };

  if (loading) return <LoadingSpinner message="Accessing global emergency frequency..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <div className="bg-red-950 text-white rounded-3xl p-8 border border-red-800 flex justify-between items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-yellow-300">System Rescue Control</span>
          <h1 className="text-3xl font-extrabold mt-1">Admin SOS Emergency Command</h1>
        </div>

        <span className="text-2xl font-extrabold text-yellow-400">
          {alerts.filter(a => a.status === 'active').length} Active Emergencies
        </span>
      </div>

      {alerts.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-3">
            <h2 className="text-base font-bold text-navy-900">Distress Feed</h2>
            {alerts.map(a => (
              <div
                key={a.id}
                onClick={() => setSelectedAlert(a)}
                className={`p-4 rounded-2xl border cursor-pointer transition space-y-2 ${
                  selectedAlert?.id === a.id ? 'bg-red-50 border-red-500 shadow' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full uppercase ${a.status === 'active' ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {a.status}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{a.created_at?.slice(0, 16)}</span>
                </div>
                <h3 className="text-sm font-bold text-navy-900">{a.user_name}</h3>
                <p className="text-xs text-slate-500">{a.trek_name}</p>
              </div>
            ))}
          </div>

          {selectedAlert ? (
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-bold text-red-600 uppercase">Emergency ID #{selectedAlert.id}</span>
                  <h2 className="text-2xl font-extrabold text-navy-900">{selectedAlert.user_name}</h2>
                  <p className="text-xs text-slate-500">Trek: {selectedAlert.trek_name}</p>
                </div>

                {selectedAlert.status === 'active' && (
                  <button
                    onClick={() => handleResolveAlert(selectedAlert.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition"
                  >
                    Mark Resolved
                  </button>
                )}
              </div>

              <TrekMap
                lat={selectedAlert.latitude}
                lng={selectedAlert.longitude}
                zoom={13}
                markers={[{ lat: selectedAlert.latitude, lng: selectedAlert.longitude, title: selectedAlert.user_name, isSos: true }]}
                height="320px"
              />
            </div>
          ) : (
            <div className="lg:col-span-2 text-slate-400 text-xs py-24 text-center">Select an emergency alert from the feed.</div>
          )}
        </div>
      ) : (
        <EmptyState
          title="No Emergency SOS Signals"
          message="No active or past emergency calls registered in system database."
          icon={ShieldAlert}
        />
      )}

    </div>
  );
}
