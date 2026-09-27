import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import TrekMap from '../../components/TrekMap';
import SOSButton from '../../components/SOSButton';
import LoadingSpinner from '../../components/LoadingSpinner';
import { MapPin, Battery, Radio, Compass, ShieldAlert, ArrowUpRight } from 'lucide-react';
import { io } from 'socket.io-client';

export default function LiveTracking() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [selectedTrekId, setSelectedTrekId] = useState(null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [myLat, setMyLat] = useState(32.2432);
  const [myLng, setMyLng] = useState(77.1892);
  const [altitude, setAltitude] = useState(3200);
  const [batteryLevel, setBatteryLevel] = useState(88);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    fetchActiveBookings();
    
    // 1. Fetch real device battery status if supported
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        setBatteryLevel(Math.round(battery.level * 100));
        battery.onlevelchange = () => {
          setBatteryLevel(Math.round(battery.level * 100));
        };
      }).catch(err => console.log("Battery API notice:", err));
    }

    // 2. Fetch real initial GPS position & elevation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setMyLat(lat);
          setMyLng(lng);
          if (pos.coords.altitude) {
            setAltitude(Math.round(pos.coords.altitude));
          } else {
            await fetchElevation(lat, lng);
          }
        },
        (err) => console.log("Initial GPS notice:", err),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }

    // Connect WebSocket
    const newSocket = io();
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const fetchElevation = async (lat, lng) => {
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`);
      const data = await res.json();
      if (data && data.elevation && data.elevation.length > 0) {
        const altMeters = Math.round(data.elevation[0]);
        setAltitude(altMeters);
        return altMeters;
      }
    } catch (e) {
      console.error("Elevation API notice:", e);
    }
    return altitude;
  };

  const fetchActiveBookings = async () => {
    try {
      const resp = await api.get('/bookings');
      setBookings(resp.data);
      if (resp.data.length > 0) {
        const firstTrekId = resp.data[0].trek_id;
        setSelectedTrekId(firstTrekId);
        fetchTrekLocations(firstTrekId);
      }
    } catch (err) {
      console.error("Fetch tracking bookings error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrekLocations = async (trekId) => {
    try {
      const resp = await api.get(`/tracking/${trekId}`);
      setLocations(resp.data);
    } catch (err) {
      console.error("Fetch locations error:", err);
    }
  };

  useEffect(() => {
    if (socket && selectedTrekId) {
      socket.emit('join_room', { room: `trek_${selectedTrekId}`, user_id: user?.id });

      socket.on('receive_gps', (gpsData) => {
        setLocations(prev => {
          const filtered = prev.filter(l => l.user_id !== gpsData.user_id);
          return [...filtered, gpsData];
        });
      });

      return () => {
        socket.emit('leave_room', { room: `trek_${selectedTrekId}`, user_id: user?.id });
        socket.off('receive_gps');
      };
    }
  }, [socket, selectedTrekId, user]);

  useEffect(() => {
    let timer;
    if (isBroadcasting && selectedTrekId) {
      triggerGpsUpdate();
      timer = setInterval(() => {
        triggerGpsUpdate();
      }, 10000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isBroadcasting, selectedTrekId, myLat, myLng, altitude, batteryLevel]);

  const triggerGpsUpdate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setMyLat(lat);
          setMyLng(lng);
          let currentAlt = pos.coords.altitude ? Math.round(pos.coords.altitude) : altitude;
          if (!pos.coords.altitude) {
            currentAlt = await fetchElevation(lat, lng);
          }
          transmitLocation(lat, lng, currentAlt);
        },
        () => transmitLocation(myLat, myLng, altitude),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      transmitLocation(myLat, myLng, altitude);
    }
  };

  const handleToggleBroadcast = () => {
    if (!isBroadcasting) {
      setIsBroadcasting(true);
      triggerGpsUpdate();
    } else {
      setIsBroadcasting(false);
    }
  };

  const transmitLocation = async (lat, lng, altVal) => {
    if (!selectedTrekId) return;
    const sendAlt = altVal !== undefined ? altVal : altitude;

    // Check battery again before transmit if available
    let currentBatt = batteryLevel;
    if ('getBattery' in navigator) {
      try {
        const b = await navigator.getBattery();
        currentBatt = Math.round(b.level * 100);
        setBatteryLevel(currentBatt);
      } catch (e) {}
    }

    try {
      await api.post('/tracking/update', {
        trek_id: selectedTrekId,
        latitude: lat,
        longitude: lng,
        altitude: sendAlt,
        battery_level: currentBatt
      });

      if (socket && socket.connected) {
        socket.emit('send_gps', {
          trek_id: selectedTrekId,
          user_id: user?.id,
          latitude: lat,
          longitude: lng,
          altitude: sendAlt,
          battery_level: currentBatt
        });
      }
    } catch (err) {
      console.error("Location transmit error:", err);
    }
  };

  if (loading) return <LoadingSpinner message="Connecting to satellite telemetry..." />;

  const currentBooking = bookings.find(b => b.trek_id === selectedTrekId);

  const mapMarkers = (locations || []).map(loc => ({
    lat: parseFloat(loc.latitude || 0),
    lng: parseFloat(loc.longitude || 0),
    title: loc.user_name || 'Participant',
    subtitle: `Alt: ${loc.altitude || 0}m • Batt: ${loc.battery_level || 100}%`
  }));

  const formatCoord = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? '0.0000' : num.toFixed(4);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* HEADER */}
      <div className="bg-navy-900 text-white rounded-3xl p-8 border border-navy-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-navy-800 text-trek-gold font-semibold text-xs rounded-full border border-navy-700">
            <Radio className="w-3.5 h-3.5 animate-pulse" /> Live Telemetry Feed
          </div>
          <h1 className="text-3xl font-extrabold mt-1">Satellite GPS Live Tracking</h1>
          <p className="text-sm text-slate-300">Broadcast your location to expedition guides & rescue dispatch.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleBroadcast}
            className={`px-5 py-3 rounded-xl font-bold text-xs shadow-lg transition flex items-center gap-2 ${
              isBroadcasting ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-navy-900'
            }`}
          >
            <Radio className={`w-4 h-4 ${isBroadcasting ? 'animate-ping' : ''}`} />
            <span>{isBroadcasting ? 'BROADCASTING LIVE' : 'START TELEMETRY'}</span>
          </button>
          
          <SOSButton trekId={selectedTrekId} trekName={currentBooking?.trek_name} />
        </div>
      </div>

      {/* TREK SELECTOR DROPDOWN */}
      {bookings.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <label className="text-xs font-bold text-navy-900">Select Active Trek:</label>
          <select
            value={selectedTrekId || ''}
            onChange={(e) => {
              const id = parseInt(e.target.value);
              setSelectedTrekId(id);
              fetchTrekLocations(id);
            }}
            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-navy-900"
          >
            {bookings.map(b => (
              <option key={b.id} value={b.trek_id}>{b.trek_name} (Trek #{b.trek_id})</option>
            ))}
          </select>
        </div>
      )}

      {/* METRICS & MAP GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* MAP PANEL */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-base font-bold text-navy-900 flex items-center gap-2">
                <Compass className="w-5 h-5 text-trek-blue" />
                Live Expedition Route Map
              </h2>
              <span className="text-xs font-mono text-slate-500">Active Participants: {locations.length}</span>
            </div>

            <TrekMap lat={myLat} lng={myLng} zoom={12} markers={mapMarkers} height="450px" />
          </div>
        </div>

        {/* TELEMETRY METRICS PANEL */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-base font-bold text-navy-900 border-b border-slate-100 pb-3">My Telemetry Data</h2>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">GPS Coordinates</span>
                  <strong className="text-xs font-mono text-navy-900">{myLat.toFixed(4)}° N, {myLng.toFixed(4)}° E</strong>
                </div>
                <MapPin className="w-6 h-6 text-trek-blue" />
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Altitude Level</span>
                  <strong className="text-lg font-extrabold text-navy-900">{altitude} meters</strong>
                </div>
                <ArrowUpRight className="w-6 h-6 text-emerald-600" />
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Device Battery</span>
                  <strong className="text-lg font-extrabold text-navy-900">{batteryLevel}%</strong>
                </div>
                <Battery className="w-6 h-6 text-amber-500" />
              </div>
            </div>

            <div className="p-4 bg-navy-900 text-slate-300 rounded-2xl text-xs space-y-2 border border-navy-800">
              <strong className="text-white block font-bold">Safety Beacon Notice</strong>
              <p>When telemetry broadcast is enabled, your position ping updates every 30 seconds to the guide's monitoring station.</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
