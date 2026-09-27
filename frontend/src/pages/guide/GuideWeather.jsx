import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { CloudSun, Wind, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function GuideWeather() {
  const { user } = useAuth();
  const [treks, setTreks] = useState([]);
  const [selectedTrekId, setSelectedTrekId] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGuideTreks();
  }, []);

  const fetchGuideTreks = async () => {
    try {
      const resp = await api.get('/treks', { params: { guide_id: user.id } });
      setTreks(resp.data);
      if (resp.data.length > 0) {
        const id = resp.data[0].id;
        setSelectedTrekId(id);
        fetchWeather(id);
      }
    } catch (err) {
      console.error("Fetch guide weather error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeather = async (trekId) => {
    try {
      const resp = await api.get(`/weather/${trekId}`);
      setWeather(resp.data);
    } catch (err) {
      console.error("Fetch weather error:", err);
    }
  };

  if (loading) return <LoadingSpinner message="Fetching Open-Meteo weather models..." />;

  const currentTrek = treks.find(t => t.id === selectedTrekId);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      
      {/* HEADER */}
      <div className="bg-navy-900 text-white rounded-3xl p-8 border border-navy-800 flex justify-between items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-trek-gold">Weather Station</span>
          <h1 className="text-3xl font-extrabold mt-1">Expedition Weather Hazards</h1>
        </div>

        {treks.length > 0 && (
          <select
            value={selectedTrekId || ''}
            onChange={(e) => {
              const id = parseInt(e.target.value);
              setSelectedTrekId(id);
              fetchWeather(id);
            }}
            className="px-4 py-2.5 bg-navy-800 border border-navy-700 text-white font-bold text-xs rounded-xl"
          >
            {treks.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        )}
      </div>

      {weather ? (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
          <div className="flex justify-between items-start border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Open-Meteo Data</span>
              <h2 className="text-2xl font-extrabold text-navy-900">{weather.trek_name}</h2>
              <p className="text-xs text-slate-500">{weather.location} ({weather.latitude}° N, {weather.longitude}° E)</p>
            </div>

            {weather.is_hazard ? (
              <span className="px-3.5 py-1.5 bg-red-600 text-white font-bold text-xs rounded-full animate-pulse flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> HAZARD CONDITIONS
              </span>
            ) : (
              <span className="px-3.5 py-1.5 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> SAFE CONDITIONS
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-center">
              <CloudSun className="w-8 h-8 text-sky-500 mx-auto" />
              <span className="text-xs text-slate-400 block font-medium">Temperature</span>
              <span className="text-3xl font-extrabold text-navy-900">{weather.temperature}°C</span>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-center">
              <Wind className="w-8 h-8 text-blue-500 mx-auto" />
              <span className="text-xs text-slate-400 block font-medium">Wind Speed</span>
              <span className="text-3xl font-extrabold text-navy-900">{weather.wind_speed} km/h</span>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-center">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
              <span className="text-xs text-slate-400 block font-medium">Condition</span>
              <span className="text-lg font-bold text-navy-900 block mt-1">{weather.condition}</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-2">
            <strong className="block font-bold text-navy-900">Safety Recommendation:</strong>
            <p>{weather.hazard_message || "Standard mountain precautions apply. Maintain clear group line-of-sight."}</p>
          </div>
        </div>
      ) : (
        <EmptyState
          title="No weather data"
          message="Select a trek to query live Open-Meteo weather models."
          icon={CloudSun}
        />
      )}

    </div>
  );
}
