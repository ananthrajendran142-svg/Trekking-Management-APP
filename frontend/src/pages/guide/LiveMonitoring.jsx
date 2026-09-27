import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import TrekMap from '../../components/TrekMap';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { MapPin, Battery, Radio, Compass, ShieldAlert, RefreshCw } from 'lucide-react';
import { io } from 'socket.io-client';

export default function LiveMonitoring() {
  const { user } = useAuth();
  const [treks, setTreks] = useState([]);
  const [selectedTrekId, setSelectedTrekId] = useState(null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    fetchGuideTreks();
    const newSocket = io();
    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, []);

  const fetchGuideTreks = async () => {
    try {
      let list = [];
      if (user?.id) {
        const resp = await api.get('/treks', { params: { guide_id: user.id } });
        list = resp.data || [];
      }
      
      // Fallback: If no assigned treks found, fetch all treks
      if (list.length === 0) {
        const allResp = await api.get('/treks');
        list = allResp.data || [];
      }

      setTreks(list);
      if (list.length > 0) {
        const initialId = list[0].id;
        setSelectedTrekId(initialId);
        fetchLocations(initialId);
      }
    } catch (err) {
      console.error("Fetch guide treks error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async (trekId) => {
    if (!trekId) return;
    try {
      const resp = await api.get(`/tracking/${trekId}`);
      setLocations(resp.data || []);
    } catch (err) {
      console.error("Fetch locations error:", err);
    }
  };

  useEffect(() => {
    if (!selectedTrekId) return;

    // Periodic polling every 5 seconds for telemetry updates
    const interval = setInterval(() => {
      fetchLocations(selectedTrekId);
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedTrekId]);

  useEffect(() => {
    if (socket && selectedTrekId) {
      socket.emit('join_room', { room: `trek_${selectedTrekId}`, user_id: user?.id });

      const handleReceiveGps = (gpsData) => {
        if (gpsData && gpsData.trek_id === selectedTrekId) {
          setLocations(prev => {
            const filtered = prev.filter(l => l.user_id !== gpsData.user_id);
            return [...filtered, gpsData];
          });
        }
      };

      socket.on('receive_gps', handleReceiveGps);

      return () => {
        socket.emit('leave_room', { room: `trek_${selectedTrekId}`, user_id: user?.id });
        socket.off('receive_gps', handleReceiveGps);
      };
    }
  }, [socket, selectedTrekId, user]);

  if (loading) return <LoadingSpinner message="Opening satellite monitoring stream..." />;

  const currentTrek = treks.find(t => t.id === selectedTrekId);
  
  const mapMarkers = (locations || []).map(l => ({
    lat: parseFloat(l.latitude || 0),
    lng: parseFloat(l.longitude || 0),
    title: l.user_name || 'Participant',
    subtitle: `Alt: ${l.altitude || 0}m • Batt: ${l.battery_level || 100}%`
  }));

  const formatCoord = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? '0.0000' : num.toFixed(4);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* HEADER */}
      <div className="bg-navy-900 text-white rounded-3xl p-8 border border-navy-800 flex justify-between items-center shadow-lg">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-navy-800 text-trek-gold font-semibold text-xs rounded-full border border-navy-700">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" /> Live Feed
          </div>
          <h1 className="text-3xl font-extrabold mt-1">Live Participant Monitoring</h1>
        </div>

        {treks.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              value={selectedTrekId || ''}
              onChange={(e) => {
                const id = parseInt(e.target.value);
                setSelectedTrekId(id);
                fetchLocations(id);
              }}
              className="px-4 py-2.5 bg-navy-800 border border-navy-700 text-white font-bold text-xs rounded-xl focus:outline-none focus:border-trek-gold"
            >
              {treks.map(t => (
                <option key={t.id} value={t.id}>{t.name} (Trek #{t.id})</option>
              ))}
            </select>

            <button
              onClick={() => fetchLocations(selectedTrekId)}
              className="p-2.5 bg-navy-800 hover:bg-navy-700 text-slate-300 rounded-xl border border-navy-700 transition"
              title="Refresh telemetry"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* MAP & ROSTER FEED GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-base font-bold text-navy-900 flex items-center gap-2">
              <Compass className="w-5 h-5 text-trek-blue" /> Live Satellite Coordinates Map
            </h2>
            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-bold">
              Active Pings: {locations.length}
            </span>
          </div>

          <TrekMap
            lat={parseFloat(currentTrek?.latitude || 32.2432)}
            lng={parseFloat(currentTrek?.longitude || 77.1892)}
            zoom={12}
            markers={mapMarkers}
            height="480px"
          />
        </div>

        {/* Live Telemetry Cards */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-navy-900 border-b border-slate-100 pb-3 flex justify-between items-center">
            <span>Participant Pings</span>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Live</span>
          </h2>

          {locations.length > 0 ? (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {locations.map(loc => (
                <div key={loc.id || loc.user_id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 hover:bg-slate-100/80 transition">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-navy-900">{loc.user_name || 'Participant'}</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {loc.updated_at ? loc.updated_at.slice(11, 16) : 'Just now'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-600">
                    <div>Lat: {formatCoord(loc.latitude)}°</div>
                    <div>Lng: {formatCoord(loc.longitude)}°</div>
                    <div>Alt: {loc.altitude || 0}m</div>
                    <div>Batt: {loc.battery_level || 100}%</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-400 py-16 text-center italic space-y-2">
              <Radio className="w-8 h-8 text-slate-300 mx-auto animate-pulse" />
              <p>No live telemetry pings received yet from trekkers.</p>
              <p className="text-[10px] text-slate-400">Pings update automatically when trekkers start telemetry broadcasting.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
