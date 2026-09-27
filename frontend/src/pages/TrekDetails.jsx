import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import TrekMap from '../components/TrekMap';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { MapPin, Calendar, Clock, Users, ShieldCheck, CloudSun, CheckCircle2, User, Star, ArrowRight, ShieldAlert } from 'lucide-react';

export default function TrekDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [trek, setTrek] = useState(null);
  const [weather, setWeather] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [numParticipants, setNumParticipants] = useState(1);
  const [bookingError, setBookingError] = useState('');

  useEffect(() => {
    fetchTrekDetails();
  }, [id]);

  const fetchTrekDetails = async () => {
    setLoading(true);
    let loadedTrek = null;

    try {
      const trekResp = await api.get(`/treks/${id}`);
      loadedTrek = trekResp.data;
    } catch (err) {
      console.warn("Trek details API warning, searching local cache:", err);
      try {
        const saved = localStorage.getItem('trekmate_custom_treks');
        if (saved) {
          const customList = JSON.parse(saved);
          loadedTrek = customList.find(t => String(t.id) === String(id) || t.name === id);
        }
      } catch (e) {
        console.error(e);
      }
    }

    if (loadedTrek) {
      setTrek(loadedTrek);
      try {
        const [weatherResp, reviewsResp] = await Promise.all([
          api.get(`/weather/${id}`).catch(() => ({ data: null })),
          api.get(`/reviews/${id}`).catch(() => ({ data: [] }))
        ]);
        if (weatherResp.data) setWeather(weatherResp.data);
        if (reviewsResp.data) setReviews(reviewsResp.data);
      } catch (e) {
        console.error(e);
      }
    }

    setLoading(false);
  };

  const handleBookNow = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'trekker') {
      setBookingError('Only registered trekkers can book slots.');
      return;
    }
    navigate(`/trekker/checkout?trek_id=${trek.id}&participants=${numParticipants}`);
  };

  if (loading) return <LoadingSpinner message="Loading expedition details & live weather..." />;
  if (!trek) return <EmptyState title="Trek Not Found" message="The requested trek details could not be found." />;

  const defaultImg = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* TOP HERO COVER */}
      <div className="relative h-80 sm:h-[400px] rounded-3xl overflow-hidden shadow-xl bg-navy-900 border border-navy-800">
        <img
          src={trek.image_url && trek.image_url.trim() ? trek.image_url : defaultImg}
          alt={trek.name}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = defaultImg;
          }}
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/40 to-transparent" />

        <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row items-start md:items-end justify-between gap-4 text-white">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-trek-gold text-navy-900 font-extrabold text-xs rounded-full uppercase">
                {trek.difficulty}
              </span>
              <span className="px-3 py-1 bg-navy-800/80 backdrop-blur-sm text-slate-200 text-xs rounded-full border border-navy-700">
                {trek.status?.toUpperCase()}
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">{trek.name}</h1>
            <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
              <MapPin className="w-4 h-4 text-trek-gold" />
              <span>{trek.location}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-navy-900/80 backdrop-blur-md p-4 rounded-2xl border border-navy-700 text-right">
            <div>
              <span className="text-xs text-slate-400 block">Trek Fee</span>
              <span className="text-2xl font-extrabold text-trek-gold">${trek.price}</span>
            </div>
            <div className="pl-4 border-l border-navy-700 text-left">
              <span className="text-xs text-slate-400 block">Available Slots</span>
              <span className="text-sm font-bold text-emerald-400">{trek.available_slots} / {trek.max_participants}</span>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT 2 COLS: OVERVIEW, ITINERARY, PREPARATION, WEATHER */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
            <div>
              <span className="text-xs text-slate-400 block font-medium">Duration</span>
              <span className="text-sm font-bold text-navy-900">{trek.duration}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Distance</span>
              <span className="text-sm font-bold text-navy-900">{trek.distance}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Difficulty</span>
              <span className="text-sm font-bold text-navy-900">{trek.difficulty}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Rating</span>
              <span className="text-sm font-bold text-trek-gold flex items-center justify-center gap-1">
                <Star className="w-3.5 h-3.5 fill-trek-gold" /> {trek.rating > 0 ? trek.rating : 'New'}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h2 className="text-lg font-bold text-navy-900">Expedition Description</h2>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{trek.description}</p>
          </div>

          {/* Itinerary */}
          {trek.itinerary && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-navy-900">Day-by-Day Itinerary</h2>
              <div className="space-y-3 text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-line font-medium">
                {trek.itinerary}
              </div>
            </div>
          )}

          {/* Preparation & Equipment */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-navy-900">Preparation & Equipment</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Required Equipment
                </h3>
                <p className="text-xs text-slate-600 whitespace-pre-line">{trek.required_equipment || "Standard alpine layers, boots, thermal sleeping bag."}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-trek-blue" /> Safety Instructions
                </h3>
                <p className="text-xs text-slate-600 whitespace-pre-line">{trek.safety_instructions || "Follow guide instructions at all times."}</p>
              </div>
            </div>
          </div>

          {/* Live Open-Meteo Weather Card */}
          {weather && (
            <div className={`p-6 rounded-2xl border shadow-sm space-y-4 ${weather.is_hazard ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-navy-900">
                  <CloudSun className="w-6 h-6 text-sky-500" />
                  <div>
                    <h3 className="text-base font-bold">Current Weather Forecast</h3>
                    <span className="text-xs text-slate-500">Source: {weather.source}</span>
                  </div>
                </div>
                {weather.is_hazard && (
                  <span className="px-3 py-1 bg-red-600 text-white font-bold text-xs rounded-full animate-pulse">
                    HAZARD ALERT
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 text-center py-2 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-xs text-slate-400 block">Temperature</span>
                  <span className="text-lg font-extrabold text-navy-900">{weather.temperature}°C</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Wind Speed</span>
                  <span className="text-lg font-extrabold text-navy-900">{weather.wind_speed} km/h</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Condition</span>
                  <span className="text-xs font-bold text-navy-900 block mt-1">{weather.condition}</span>
                </div>
              </div>

              {weather.hazard_message && (
                <p className="text-xs font-medium text-slate-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                  {weather.hazard_message}
                </p>
              )}
            </div>
          )}

          {/* Meeting Point Map */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-navy-900">Meeting Point & Route Base</h2>
            <p className="text-xs text-slate-500">
              Meeting point: <strong className="text-navy-900">{trek.meeting_point || 'Base village campsite'}</strong>
            </p>
            <TrekMap lat={trek.latitude} lng={trek.longitude} zoom={11} height="300px" />
          </div>

        </div>

        {/* RIGHT COL: BOOKING WIDGET & GUIDE INFO */}
        <div className="space-y-6">
          
          {/* Booking Widget */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl space-y-6 sticky top-20">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs text-slate-400 block font-medium">Slot Registration</span>
              <div className="text-2xl font-extrabold text-navy-900">${trek.price * numParticipants}</div>
              <span className="text-xs text-slate-500">for {numParticipants} participant(s)</span>
            </div>

            {trek.available_slots > 0 ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-navy-900 mb-1">Number of Participants</label>
                  <select
                    value={numParticipants}
                    onChange={(e) => setNumParticipants(parseInt(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-navy-900"
                  >
                    {[...Array(Math.min(trek.available_slots, 10)).keys()].map(i => (
                      <option key={i + 1} value={i + 1}>{i + 1} Person(s)</option>
                    ))}
                  </select>
                </div>

                {bookingError && (
                  <div className="p-3 bg-red-50 text-red-600 text-xs font-medium rounded-xl border border-red-200">
                    {bookingError}
                  </div>
                )}

                <button
                  onClick={handleBookNow}
                  className="w-full py-3.5 bg-trek-gold hover:bg-trek-goldHover text-navy-900 font-extrabold rounded-xl shadow-lg transition text-sm flex items-center justify-center gap-2"
                >
                  <span>Book Expedition Slot</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="p-4 bg-slate-100 rounded-xl text-center text-slate-500 text-sm font-bold">
                Fully Booked
              </div>
            )}

            {/* Guide Profile Card */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Assigned Guide</span>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-10 h-10 rounded-full bg-navy-900 text-trek-gold font-bold flex items-center justify-center text-sm">
                  {trek.guide_name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-bold text-navy-900">{trek.guide_name}</div>
                  <div className="text-xs text-slate-500">Certified Expedition Lead</div>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
