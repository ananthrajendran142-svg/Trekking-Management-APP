import React, { useState, useEffect } from 'react';
import api from '../../api';
import TrekMap from '../../components/TrekMap';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { ShieldAlert, CheckCircle2, Phone, MapPin, Radio } from 'lucide-react';

export default function GuideSOSAlerts() {
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
      if (resp.data.length > 0) {
        setSelectedAlert(resp.data[0]);
      }
    } catch (err) {
      console.error("Fetch SOS alerts error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveAlert = async (id) => {
    try {
      await api.put(`/sos/${id}/resolve`);
      fetchSOSAlerts();
    } catch (err) {
      alert("Failed to mark alert as resolved.");
    }
  };

  if (loading) return <LoadingSpinner message="Checking emergency distress frequency..." />;

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const resolvedAlerts = alerts.filter(a => a.status === 'resolved');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* HEADER */}
      <div className="bg-red-950 text-white rounded-3xl p-8 border border-red-800 flex justify-between items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-900 text-yellow-300 font-bold text-xs rounded-full border border-red-700">
            <Radio className="w-3.5 h-3.5 animate-pulse text-red-400" /> High Altitude Rescue Control
          </div>
          <h1 className="text-3xl font-extrabold mt-1">Emergency SOS Alerts</h1>
          <p className="text-sm text-red-200">Real-time distress signals dispatched by active expedition trekkers.</p>
        </div>

        <div className="text-right">
          <span className="text-xs text-red-300 block font-medium">Active Emergencies</span>
          <span className="text-3xl font-extrabold text-yellow-400">{activeAlerts.length}</span>
        </div>
      </div>

      {alerts.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ALERTS LIST */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-navy-900">Distress Feed</h2>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {alerts.map(a => (
                <div
                  key={a.id}
                  onClick={() => setSelectedAlert(a)}
                  className={`p-4 rounded-2xl border cursor-pointer transition space-y-2 ${
                    selectedAlert?.id === a.id ? 'bg-red-50 border-red-500 shadow-md' : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full uppercase ${
                      a.status === 'active' ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {a.status}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{a.created_at?.slice(0, 16)}</span>
                  </div>

                  <h3 className="text-sm font-bold text-navy-900">{a.user_name}</h3>
                  <p className="text-xs text-slate-600 truncate">{a.trek_name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* SELECTED ALERT MAP & DETAILS */}
          {selectedAlert ? (
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Distress Signal #{selectedAlert.id}</span>
                  <h2 className="text-2xl font-extrabold text-navy-900">{selectedAlert.user_name}</h2>
                  <p className="text-xs text-slate-500">Trek: {selectedAlert.trek_name}</p>
                </div>

                {selectedAlert.status === 'active' && (
                  <button
                    onClick={() => handleResolveAlert(selectedAlert.id)}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Mark Emergency Resolved
                  </button>
                )}
              </div>

              <div className="p-4 bg-red-50 text-red-900 rounded-2xl border border-red-200 text-xs font-medium space-y-1">
                <strong className="block font-bold text-red-700">Message Broadcast:</strong>
                <p>"{selectedAlert.message}"</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100 font-mono">
                <div>Latitude: <strong className="text-navy-900">{selectedAlert.latitude.toFixed(4)}° N</strong></div>
                <div>Longitude: <strong className="text-navy-900">{selectedAlert.longitude.toFixed(4)}° E</strong></div>
                <div>Contact Phone: <strong className="text-navy-900">{selectedAlert.user_phone || 'N/A'}</strong></div>
                <div>Time Dispatched: <strong className="text-navy-900">{selectedAlert.created_at?.slice(11, 19)}</strong></div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase text-slate-400">Emergency Pinpoint Map</h3>
                <TrekMap
                  lat={selectedAlert.latitude}
                  lng={selectedAlert.longitude}
                  zoom={13}
                  markers={[{ lat: selectedAlert.latitude, lng: selectedAlert.longitude, title: selectedAlert.user_name, isSos: true }]}
                  height="300px"
                />
              </div>
            </div>
          ) : (
            <div className="lg:col-span-2 text-slate-400 text-xs py-24 text-center">Select an emergency alert from the feed to view rescue pinpoint.</div>
          )}

        </div>
      ) : (
        <EmptyState
          title="No Emergency SOS Signals"
          message="No active or past emergency distress calls exist in the database frequency."
          icon={ShieldAlert}
        />
      )}

    </div>
  );
}
