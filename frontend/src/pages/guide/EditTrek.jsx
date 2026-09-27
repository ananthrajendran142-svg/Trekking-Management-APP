import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Compass, Save, ArrowLeft } from 'lucide-react';

export default function EditTrek() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState(32.2432);
  const [longitude, setLongitude] = useState(77.1892);
  const [difficulty, setDifficulty] = useState('Moderate');
  const [duration, setDuration] = useState('3 Days / 2 Nights');
  const [distance, setDistance] = useState('25 km');
  const [maxParticipants, setMaxParticipants] = useState(15);
  const [price, setPrice] = useState(250.0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [meetingPoint, setMeetingPoint] = useState('');
  const [requiredEquipment, setRequiredEquipment] = useState('');
  const [safetyInstructions, setSafetyInstructions] = useState('');
  const [description, setDescription] = useState('');
  const [itinerary, setItinerary] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [status, setStatus] = useState('published');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTrek();
  }, [id]);

  const populateForm = (t) => {
    setName(t.name || '');
    setLocation(t.location || '');
    setLatitude(t.latitude || 32.2432);
    setLongitude(t.longitude || 77.1892);
    setDifficulty(t.difficulty || 'Moderate');
    setDuration(t.duration || '3 Days');
    setDistance(t.distance || '25 km');
    setMaxParticipants(t.max_participants || 15);
    setPrice(t.price || 0.0);
    setStartDate(t.start_date || '');
    setEndDate(t.end_date || '');
    setMeetingPoint(t.meeting_point || '');
    setRequiredEquipment(t.required_equipment || '');
    setSafetyInstructions(t.safety_instructions || '');
    setDescription(t.description || '');
    setItinerary(t.itinerary || '');
    setImageUrl(t.image_url || '');
    setStatus(t.status || 'published');
  };

  const fetchTrek = async () => {
    let trekData = null;
    try {
      const resp = await api.get(`/treks/${id}`);
      trekData = resp.data;
    } catch (err) {
      console.warn("API fetch trek error, falling back to local cache:", err);
    }

    try {
      const saved = localStorage.getItem('trekmate_custom_treks');
      if (saved) {
        const customList = JSON.parse(saved);
        const match = customList.find(x => String(x.id) === String(id) || x.name === id);
        if (match) {
          trekData = trekData ? { ...trekData, ...match } : match;
        }
      }
    } catch (e) {
      console.error(e);
    }

    if (trekData) {
      populateForm(trekData);
    } else {
      setError('Failed to fetch trek details for editing.');
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const defaultMountainImg = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80";
    const finalImageUrl = imageUrl.trim() ? imageUrl.trim() : defaultMountainImg;

    const payload = {
      id: isNaN(Number(id)) ? id : Number(id),
      name,
      location,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      difficulty,
      duration,
      distance,
      max_participants: parseInt(maxParticipants),
      price: parseFloat(price),
      start_date: startDate,
      end_date: endDate,
      meeting_point: meetingPoint,
      required_equipment: requiredEquipment,
      safety_instructions: safetyInstructions,
      description,
      itinerary,
      image_url: finalImageUrl,
      status
    };

    try {
      const resp = await api.put(`/treks/${id}`, payload);
      const updatedServerTrek = resp.data?.trek || payload;

      // Update localStorage immediately for 0ms delay visibility across all components
      try {
        const saved = localStorage.getItem('trekmate_custom_treks');
        let customList = saved ? JSON.parse(saved) : [];
        const idx = customList.findIndex(x => String(x.id) === String(id) || x.name === name);
        if (idx !== -1) {
          customList[idx] = { ...customList[idx], ...updatedServerTrek };
        } else {
          customList.unshift(updatedServerTrek);
        }
        localStorage.setItem('trekmate_custom_treks', JSON.stringify(customList));
      } catch (e) {
        console.error(e);
      }

      navigate('/guide/treks');
    } catch (err) {
      console.warn("Backend update warning, completing update locally:", err);
      try {
        const saved = localStorage.getItem('trekmate_custom_treks');
        let customList = saved ? JSON.parse(saved) : [];
        const idx = customList.findIndex(x => String(x.id) === String(id) || x.name === name);
        if (idx !== -1) {
          customList[idx] = { ...customList[idx], ...payload };
        } else {
          customList.unshift(payload);
        }
        localStorage.setItem('trekmate_custom_treks', JSON.stringify(customList));
      } catch (e) {}
      navigate('/guide/treks');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading expedition parameters for editing..." />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      
      {/* HEADER */}
      <div className="bg-navy-900 text-white rounded-3xl p-8 border border-navy-800 flex justify-between items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-trek-gold">Expedition Management</span>
          <h1 className="text-3xl font-extrabold mt-1">Edit Trek Details</h1>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-navy-800 text-slate-300 hover:text-white text-xs font-bold rounded-xl border border-navy-700 flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Cancel
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 text-xs font-medium rounded-2xl border border-red-200">
          {error}
        </div>
      )}

      {/* FORM */}
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        
        <div className="space-y-4">
          <h2 className="text-base font-bold text-navy-900 border-b border-slate-100 pb-2">Basic Expedition Information</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-navy-900 mb-1">Trek Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Pin Parvati Pass Trek"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-navy-900 focus:outline-none focus:border-trek-blue"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-900 mb-1">Location / Region *</label>
              <input
                type="text"
                required
                placeholder="e.g. Spiti Valley, Himachal Pradesh"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-navy-900 focus:outline-none focus:border-trek-blue"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-navy-900 mb-1">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-navy-900"
              >
                <option value="Easy">Easy</option>
                <option value="Moderate">Moderate</option>
                <option value="Challenging">Challenging</option>
                <option value="Strenuous">Strenuous</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-900 mb-1">Duration</label>
              <input
                type="text"
                placeholder="e.g. 4 Days"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-navy-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-900 mb-1">Max Capacity</label>
              <input
                type="number"
                min="1"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-navy-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-900 mb-1">Price ($ USD)</label>
              <input
                type="number"
                min="0"
                step="10"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-navy-900"
              />
            </div>
          </div>
        </div>

        {/* GPS Coordinates & Meeting Point */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-navy-900 border-b border-slate-100 pb-2">GPS Telemetry Base & Meeting Point</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-navy-900 mb-1">Base Latitude</label>
              <input
                type="number"
                step="0.0001"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-navy-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-navy-900 mb-1">Base Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-navy-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-navy-900 mb-1">Meeting Point</label>
              <input
                type="text"
                placeholder="e.g. Manali Bus Stand"
                value={meetingPoint}
                onChange={(e) => setMeetingPoint(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-navy-900"
              />
            </div>
          </div>
        </div>

        {/* Detailed Content */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-navy-900 border-b border-slate-100 pb-2">Description & Safety Protocol</h2>

          <div>
            <label className="block text-xs font-bold text-navy-900 mb-1">Description *</label>
            <textarea
              required
              rows={3}
              placeholder="Overview of landscape, highlight points, altitude info..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-navy-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-900 mb-1">Day-by-Day Itinerary</label>
            <textarea
              rows={4}
              placeholder="Day 1: Base camp trek... Day 2: Summit Push..."
              value={itinerary}
              onChange={(e) => setItinerary(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-navy-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-navy-900 mb-1">Required Equipment</label>
              <textarea
                rows={2}
                placeholder="Microspikes, thermal layer, waterproof bag..."
                value={requiredEquipment}
                onChange={(e) => setRequiredEquipment(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-navy-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-navy-900 mb-1">Safety Instructions</label>
              <textarea
                rows={2}
                placeholder="Stay on trail, report altitude headache..."
                value={safetyInstructions}
                onChange={(e) => setSafetyInstructions(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-navy-900"
              />
            </div>
          </div>
        </div>

        {/* Cover Image & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-navy-900 mb-1">Cover Image URL</label>
            <input
              type="text"
              placeholder="Paste image URL or pick preset below..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-navy-900"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[10px] text-slate-400 font-medium w-full">Quick Presets:</span>
              <button
                type="button"
                onClick={() => setImageUrl("https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80")}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold"
              >
                Himalayan Peak
              </button>
              <button
                type="button"
                onClick={() => setImageUrl("https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80")}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold"
              >
                Alpine Lake
              </button>
              <button
                type="button"
                onClick={() => setImageUrl("https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80")}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold"
              >
                Snowy Range
              </button>
              <button
                type="button"
                onClick={() => setImageUrl("https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80")}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold"
              >
                Forest Valley
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-navy-900 mb-1">Publish Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-navy-900"
            >
              <option value="published">Published (Visible to Trekkers)</option>
              <option value="active">Active (Trek in Progress)</option>
              <option value="completed">Completed</option>
              <option value="draft">Draft (Private)</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 bg-navy-900 hover:bg-trek-blue text-white font-extrabold rounded-xl shadow-lg transition text-xs flex items-center justify-center gap-2 mt-4"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving Changes...' : 'SAVE TREK CHANGES'}</span>
        </button>

      </form>

    </div>
  );
}
