import React from 'react';
import { Link } from 'react-router-dom';
import { Mountain, ShieldCheck, Radio, CloudSun, PhoneCall } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#0A1428] text-slate-400 border-t border-navy-800 mt-auto text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Col 1 */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2 font-bold text-xl text-white">
              <div className="p-1.5 bg-gradient-to-tr from-trek-blue to-trek-gold rounded-lg">
                <Mountain className="w-5 h-5 text-white" />
              </div>
              <span>Trek<span className="text-trek-gold">Mate</span></span>
            </Link>
            <p className="text-xs leading-relaxed text-slate-400">
              Centralized high-altitude trekking management platform connecting Trekkers, Certified Guides, and Rescue Operations with real-time GPS tracking, weather hazard alerts, emergency SOS, and RAG AI assistance.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-navy-800/80 p-2 rounded-lg border border-navy-700 w-fit">
              <ShieldCheck className="w-4 h-4" /> 24/7 Mountain Rescue Protocol
            </div>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Quick Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/treks" className="hover:text-trek-gold transition">Browse Expeditions</Link></li>
              <li><Link to="/ai" className="hover:text-trek-gold transition">RAG AI Assistant</Link></li>
              <li><Link to="/login" className="hover:text-trek-gold transition">Member Login</Link></li>
              <li><Link to="/register" className="hover:text-trek-gold transition">Become a Guide / Trekker</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Platform Features</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2"><Radio className="w-3.5 h-3.5 text-trek-gold" /> Satellite GPS Telemetry</li>
              <li className="flex items-center gap-2"><CloudSun className="w-3.5 h-3.5 text-trek-gold" /> Open-Meteo Weather Hazards</li>
              <li className="flex items-center gap-2"><PhoneCall className="w-3.5 h-3.5 text-red-400" /> One-Touch SOS Dispatch</li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Emergency Contact</h4>
            <p className="text-xs mb-2">Mountain Rescue Helpline:</p>
            <div className="text-lg font-bold text-white mb-2">+1 800-TREKMATE</div>
            <p className="text-xs text-slate-500">Available 24 hours a day for active expedition emergencies.</p>
          </div>

        </div>

        <div className="border-t border-navy-800 mt-10 pt-6 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} TrekMate Management Platform. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-400 cursor-pointer">Safety Protocol</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
