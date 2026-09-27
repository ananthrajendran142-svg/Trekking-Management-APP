import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Clock, Users, Star, ArrowRight, ShieldCheck } from 'lucide-react';

export default function TrekCard({ trek }) {
  const getDifficultyColor = (diff) => {
    switch (diff?.toLowerCase()) {
      case 'easy': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'moderate': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'challenging': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'strenuous': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const defaultImg = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group">
      {/* Image container */}
      <div className="relative h-48 overflow-hidden bg-navy-900">
        <img
          src={trek.image_url && trek.image_url.trim() ? trek.image_url : defaultImg}
          alt={trek.name}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = defaultImg;
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`px-2.5 py-1 text-xs font-bold rounded-full border shadow-sm ${getDifficultyColor(trek.difficulty)}`}>
            {trek.difficulty}
          </span>
          {trek.status && (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-navy-900/80 text-white backdrop-blur-sm border border-navy-700 capitalize">
              {trek.status}
            </span>
          )}
        </div>
        <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-navy-900/90 text-trek-gold rounded-lg text-xs font-bold flex items-center gap-1 border border-navy-700 backdrop-blur-sm">
          <Star className="w-3.5 h-3.5 fill-trek-gold" />
          <span>{trek.rating > 0 ? trek.rating : 'New'} ({trek.review_count})</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center text-xs font-medium text-slate-500 mb-1">
            <MapPin className="w-3.5 h-3.5 text-trek-blue mr-1 shrink-0" />
            <span className="truncate">{trek.location}</span>
          </div>
          <h3 className="text-lg font-bold text-navy-900 group-hover:text-trek-blue transition line-clamp-1">
            {trek.name}
          </h3>
          <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
            {trek.description}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-100 text-slate-600 font-medium">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{trek.duration}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>{trek.available_slots} / {trek.max_participants} slots</span>
          </div>
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Starting from</span>
            <span className="text-xl font-extrabold text-navy-900">
              ${trek.price} <span className="text-xs font-normal text-slate-500">/ trekker</span>
            </span>
          </div>

          <Link
            to={`/treks/${trek.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-navy-900 hover:bg-trek-blue text-white font-semibold text-xs rounded-xl shadow transition"
          >
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
