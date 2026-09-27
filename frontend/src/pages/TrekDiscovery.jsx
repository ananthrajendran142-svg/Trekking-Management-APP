import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import TrekCard from '../components/TrekCard';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import { Search, Filter, Compass, SlidersHorizontal, RefreshCw } from 'lucide-react';

export default function TrekDiscovery() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [treks, setTreks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [difficulty, setDifficulty] = useState(searchParams.get('difficulty') || 'All');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || 2000);

  useEffect(() => {
    fetchTreks();
  }, [searchParams]);

  const fetchTreks = async () => {
    setLoading(true);
    let loadedTreks = [];
    try {
      const params = {};
      if (searchParams.get('search')) params.search = searchParams.get('search');
      if (searchParams.get('difficulty') && searchParams.get('difficulty') !== 'All') {
        params.difficulty = searchParams.get('difficulty');
      }
      if (searchParams.get('max_price')) params.max_price = searchParams.get('max_price');

      const resp = await api.get('/treks', { params });
      loadedTreks = resp.data || [];
    } catch (err) {
      console.warn("Trek discovery API warning, falling back to cached treks:", err);
    }

    try {
      const saved = localStorage.getItem('trekmate_custom_treks');
      if (saved) {
        const customTreks = JSON.parse(saved);
        customTreks.forEach(ct => {
          const idx = loadedTreks.findIndex(lt => String(lt.id) === String(ct.id) || lt.name.toLowerCase() === ct.name.toLowerCase());
          if (idx !== -1) {
            loadedTreks[idx] = { ...loadedTreks[idx], ...ct };
          } else {
            loadedTreks.unshift(ct);
          }
        });
      }
    } catch (e) {
      console.error(e);
    }

    setTreks(loadedTreks);
    setLoading(false);
  };

  const applyFilters = (e) => {
    if (e) e.preventDefault();
    const newParams = {};
    if (search.trim()) newParams.search = search.trim();
    if (difficulty !== 'All') newParams.difficulty = difficulty;
    if (maxPrice) newParams.max_price = maxPrice;
    setSearchParams(newParams);
  };

  const resetFilters = () => {
    setSearch('');
    setDifficulty('All');
    setMaxPrice(2000);
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* HEADER */}
      <div className="bg-navy-900 text-white rounded-3xl p-8 border border-navy-800 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-trek-gold">Expedition Catalogue</span>
          <h1 className="text-3xl font-extrabold">Explore Treks</h1>
          <p className="text-sm text-slate-300">
            Find the right trekking experience with real-time slot availability, verified guides, and altitude metrics.
          </p>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <form onSubmit={applyFilters} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Search Input */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-navy-900 mb-1">Search Keywords</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                placeholder="Search by trek name, region or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-navy-900 focus:outline-none focus:border-trek-blue font-medium"
              />
            </div>
          </div>

          {/* Difficulty Dropdown */}
          <div>
            <label className="block text-xs font-bold text-navy-900 mb-1">Difficulty Level</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-navy-900 focus:outline-none focus:border-trek-blue font-medium"
            >
              <option value="All">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Moderate">Moderate</option>
              <option value="Challenging">Challenging</option>
              <option value="Strenuous">Strenuous</option>
            </select>
          </div>

          {/* Max Price Slider */}
          <div>
            <div className="flex justify-between text-xs font-bold text-navy-900 mb-1">
              <span>Max Price</span>
              <span className="text-trek-blue">${maxPrice}</span>
            </div>
            <input
              type="range"
              min="50"
              max="2000"
              step="50"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full accent-trek-blue cursor-pointer mt-2"
            />
          </div>

        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={resetFilters}
            className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-navy-900 flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset Filters
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-navy-900 hover:bg-trek-blue text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-2"
          >
            <Filter className="w-3.5 h-3.5" /> Apply Filters
          </button>
        </div>
      </form>

      {/* RESULTS GRID */}
      {loading ? (
        <LoadingSpinner message="Searching available expeditions..." />
      ) : treks.length > 0 ? (
        <div className="space-y-4">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Showing {treks.length} available expedition(s)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {treks.map((trek) => (
              <TrekCard key={trek.id} trek={trek} />
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          title="No matching treks found"
          message="No treks match your search parameters or exist in the database yet. Try adjusting your filters."
          icon={Compass}
          actionText="Reset All Filters"
          onAction={resetFilters}
        />
      )}

    </div>
  );
}
