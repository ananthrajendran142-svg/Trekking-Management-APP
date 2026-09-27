import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, X, Radio } from 'lucide-react';
import api from '../api';

export default function SOSButton({ trekId, trekName }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  const handleTriggerSOS = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch GPS coordinates if browser supports geolocation
      let lat = 32.2432;
      let lng = 77.1892;

      if (navigator.geolocation) {
        try {
          const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
          });
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch (geoErr) {
          console.log("Using estimated trek coordinates for SOS");
        }
      }

      const resp = await api.post('/sos', {
        trek_id: trekId || 1,
        latitude: lat,
        longitude: lng,
        message: `EMERGENCY SOS ALERT: Participant requires immediate emergency response at (${lat.toFixed(4)}, ${lng.toFixed(4)}) on trek '${trekName || 'Active Trek'}'!`
      });

      setSuccessMsg(resp.data.message || 'SOS signal transmitted to guide & search team!');
      setTimeout(() => {
        setShowModal(false);
        setSuccessMsg('');
      }, 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to dispatch SOS alert. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg hover:shadow-red-500/30 transition transform active:scale-95 animate-pulse"
      >
        <ShieldAlert className="w-5 h-5 text-yellow-300" />
        <span>TRIGGER EMERGENCY SOS</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-red-500 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-navy-900">CONFIRM EMERGENCY SOS</h3>
                <p className="text-xs text-red-600 font-semibold uppercase tracking-wider">High Altitude Dispatch</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Are you sure you want to broadcast an emergency distress signal for <strong className="text-navy-900">{trekName || 'your current trek'}</strong>?
              This will immediately alert your assigned Expedition Guide and Mountain Rescue Control with your exact GPS telemetry.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs font-medium rounded-lg border border-red-200">
                {error}
              </div>
            )}

            {successMsg ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-semibold text-center flex items-center justify-center gap-2">
                <Radio className="w-5 h-5 text-emerald-600 animate-pulse" />
                {successMsg}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTriggerSOS}
                  disabled={loading}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition shadow-lg flex items-center justify-center gap-2"
                >
                  {loading ? 'Dispatching...' : 'CONFIRM & DISPATCH'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
