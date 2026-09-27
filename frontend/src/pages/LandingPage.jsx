import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import TrekCard from '../components/TrekCard';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import { Search, ShieldCheck, MapPin, CloudSun, Bot, Compass, Star, ArrowRight, Mountain, CheckCircle2 } from 'lucide-react';

export default function LandingPage() {
  const [featuredTreks, setFeaturedTreks] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchLandingData();
  }, []);

  const fetchLandingData = async () => {
    try {
      const [treksResp, reviewsResp] = await Promise.all([
        api.get('/treks').catch(() => ({ data: [] })),
        api.get('/reviews').catch(() => ({ data: [] }))
      ]);
      
      let fetchedTreks = Array.isArray(treksResp?.data) ? treksResp.data : [];
      const trekMap = new Map();
      fetchedTreks.forEach(t => trekMap.set(String(t.id), t));

      try {
        const saved = localStorage.getItem('trekmate_custom_treks');
        if (saved) {
          const customTreks = JSON.parse(saved);
          customTreks.forEach(ct => {
            const key = String(ct.id);
            if (trekMap.has(key)) {
              trekMap.set(key, { ...trekMap.get(key), ...ct });
            } else {
              trekMap.set(key, ct);
            }
          });
        }
      } catch (e) {
        console.error(e);
      }

      const combinedTreks = Array.from(trekMap.values());
      setFeaturedTreks(combinedTreks.slice(0, 6));
      setReviews(Array.isArray(reviewsResp?.data) ? reviewsResp.data.slice(0, 4) : []);
    } catch (err) {
      console.error("Landing page fetch error:", err);
      try {
        const customTreks = JSON.parse(localStorage.getItem('trekmate_custom_treks') || '[]');
        setFeaturedTreks(customTreks.slice(0, 6));
      } catch (e) {
        setFeaturedTreks([]);
      }
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/treks?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="space-y-16 pb-16">
      
      {/* HERO SECTION */}
      <section className="relative min-h-[580px] bg-[#070D1B] text-white flex items-center justify-center overflow-hidden border-b border-navy-800">
        {/* Mountain background overlay with radial gradient */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-overlay"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2000&q=80')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#070D1B]/40 via-[#070D1B]/80 to-[#070D1B]" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-7 py-16">
          
          {/* Integrated High-Altitude Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0E1A30]/90 border border-[#DF9F35]/40 text-[#DF9F35] text-xs font-semibold shadow-md backdrop-blur-md">
            <ShieldCheck className="w-4 h-4 text-[#DF9F35]" />
            <span>Integrated High-Altitude Trek Management</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            Explore. Trek. Be a Part of <br className="hidden sm:inline" />
            <span className="text-[#DF9F35]">Something Bigger.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            Discover breathtaking alpine routes, monitor live satellite GPS telemetry, receive real-time weather hazard warnings, and access emergency mountain rescue protocols.
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center p-1.5 bg-[#121F38] rounded-2xl border border-slate-700/80 shadow-2xl space-y-2 sm:space-y-0">
            <div className="relative flex-1 w-full flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-4" />
              <input
                type="text"
                placeholder="Search treks, locations, or Himalayan regions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-transparent text-white placeholder-slate-400 focus:outline-none text-sm font-medium"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-7 py-3 bg-[#DF9F35] hover:bg-[#c98c2a] text-[#070D1B] font-extrabold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 shrink-0"
            >
              <span>Search Treks</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* 4 Feature Indicator Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 max-w-5xl mx-auto text-left">
            <div className="flex items-center gap-3.5 p-3.5 bg-[#0F1C33]/90 rounded-2xl border border-slate-800 shadow-lg backdrop-blur-sm">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Safe & Secure</div>
                <div className="text-[11px] text-slate-400">Verified guides</div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 bg-[#0F1C33]/90 rounded-2xl border border-slate-800 shadow-lg backdrop-blur-sm">
              <div className="p-2 bg-amber-500/10 text-[#DF9F35] rounded-xl">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Real-Time Tracking</div>
                <div className="text-[11px] text-slate-400">Satellite GPS</div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 bg-[#0F1C33]/90 rounded-2xl border border-slate-800 shadow-lg backdrop-blur-sm">
              <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl">
                <CloudSun className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Weather Alerts</div>
                <div className="text-[11px] text-slate-400">Open-Meteo live</div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 bg-[#0F1C33]/90 rounded-2xl border border-slate-800 shadow-lg backdrop-blur-sm">
              <div className="p-2 bg-purple-500/10 text-indigo-400 rounded-xl">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">24/7 AI Assistance</div>
                <div className="text-[11px] text-slate-400">RAG knowledge</div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* FEATURED TREKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-trek-blue">Curated Expeditions</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 mt-1">Featured Treks</h2>
          </div>
          <Link to="/treks" className="inline-flex items-center gap-1.5 text-sm font-bold text-trek-blue hover:text-navy-900 transition">
            <span>View All Treks</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner message="Fetching featured expeditions..." />
        ) : featuredTreks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredTreks.map((trek) => (
              <TrekCard key={trek.id} trek={trek} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No featured treks available yet"
            message="No active treks are listed in the database right now. Guides or administrators can publish treks from their dashboard."
            icon={Compass}
          />
        )}
      </section>

      {/* WHY CHOOSE TREKMATE */}
      <section className="bg-navy-900 text-white py-16 border-y border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-trek-gold">Built For Mountain Safety</span>
            <h2 className="text-3xl font-extrabold text-white mt-1">Why Choose TrekMate Platform</h2>
            <p className="text-sm text-slate-400 mt-2">Comprehensive management built specifically for high-altitude trekking operations.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-navy-800 rounded-2xl border border-navy-700 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-trek-blue/20 text-trek-gold flex items-center justify-center font-bold">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Wide Trek Options</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Filter by difficulty, duration, elevation, and location to find the perfect expedition tailored to your fitness level.
              </p>
            </div>

            <div className="p-6 bg-navy-800 rounded-2xl border border-navy-700 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Secure Booking & Roster</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Manage participant slots, check-in rosters, and guide assignment in one centralized database.
              </p>
            </div>

            <div className="p-6 bg-navy-800 rounded-2xl border border-navy-700 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">AI RAG Assistant</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Query official gear checklists, safety guidelines, and route itineraries powered by document vector retrieval.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS & REVIEWS FROM DATABASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-trek-blue">Authentic Feedback</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 mt-1">Trekker Reviews</h2>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading authentic trekker reviews..." />
        ) : reviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-navy-800 text-trek-gold font-bold flex items-center justify-center text-sm">
                      {rev.user_name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-navy-900">{rev.user_name}</div>
                      <div className="text-xs text-slate-400">{rev.trek_name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-trek-gold text-xs font-bold">
                    <Star className="w-4 h-4 fill-trek-gold" />
                    <span>{rev.rating}.0</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 italic leading-relaxed">
                  "{rev.comment}"
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No reviews yet"
            message="No completed trek reviews have been recorded in the database yet."
            icon={Star}
          />
        )}
      </section>

    </div>
  );
}
