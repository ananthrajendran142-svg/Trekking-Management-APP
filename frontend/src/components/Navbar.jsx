import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mountain, Compass, ShieldAlert, Bot, User as UserIcon, LogOut, Menu, X, Bell, LayoutDashboard, CalendarCheck, MapPin, MessageSquare, CloudSun, Users, BarChart3, Star } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-[#0A1428] text-white border-b border-navy-700 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2.5 font-black text-xl text-white hover:opacity-95 transition">
            <div className="p-2 bg-gradient-to-tr from-trek-blue via-blue-600 to-amber-500 rounded-xl shadow-md">
              <Mountain className="w-5 h-5 text-white" />
            </div>
            <span className="tracking-tight">Trek<span className="text-[#DF9F35]">Mate</span></span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-6 text-sm font-semibold">
            {!user ? (
              <>
                <Link to="/" className="text-slate-200 hover:text-[#DF9F35] transition">Home</Link>
                <Link to="/treks" className="text-slate-200 hover:text-[#DF9F35] transition">Explore Treks</Link>
                <Link to="/ai" className="text-slate-200 hover:text-[#DF9F35] transition flex items-center gap-1.5"><Bot className="w-4 h-4 text-[#DF9F35]" /> AI Assistant</Link>
                <div className="flex items-center space-x-3 ml-4">
                  <Link to="/login" className="px-4 py-2 text-slate-200 hover:text-white transition">Login</Link>
                  <Link to="/register" className="px-5 py-2.5 bg-[#DF9F35] hover:bg-[#c98c2a] text-[#0A1428] font-black text-xs rounded-xl shadow-md transition uppercase tracking-wide">Register</Link>
                </div>
              </>
            ) : user?.role === 'trekker' ? (
              <>
                <Link to="/trekker/dashboard" className="hover:text-trek-gold flex items-center gap-1.5"><LayoutDashboard className="w-4 h-4" /> Dashboard</Link>
                <Link to="/treks" className="hover:text-trek-gold flex items-center gap-1.5"><Compass className="w-4 h-4" /> Treks</Link>
                <Link to="/trekker/bookings" className="hover:text-trek-gold flex items-center gap-1.5"><CalendarCheck className="w-4 h-4" /> Bookings</Link>
                <Link to="/trekker/reviews" className="hover:text-trek-gold flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-400" /> Reviews</Link>
                <Link to="/trekker/tracking" className="hover:text-trek-gold flex items-center gap-1.5"><MapPin className="w-4 h-4" /> Tracking</Link>
                <Link to="/trekker/messages" className="hover:text-trek-gold flex items-center gap-1.5"><MessageSquare className="w-4 h-4" /> Messages</Link>
                <Link to="/ai" className="hover:text-trek-gold flex items-center gap-1.5"><Bot className="w-4 h-4 text-trek-gold" /> AI Assistant</Link>
              </>
            ) : user?.role === 'guide' ? (
              <>
                <Link to="/guide/dashboard" className="hover:text-trek-gold flex items-center gap-1.5"><LayoutDashboard className="w-4 h-4" /> Dashboard</Link>
                <Link to="/guide/treks" className="hover:text-trek-gold flex items-center gap-1.5"><Compass className="w-4 h-4" /> My Treks</Link>
                <Link to="/guide/participants" className="hover:text-trek-gold flex items-center gap-1.5"><Users className="w-4 h-4" /> Participants</Link>
                <Link to="/guide/tracking" className="hover:text-trek-gold flex items-center gap-1.5"><MapPin className="w-4 h-4" /> Live Tracking</Link>
                <Link to="/guide/messages" className="hover:text-trek-gold flex items-center gap-1.5"><MessageSquare className="w-4 h-4" /> Messages</Link>
                <Link to="/guide/sos" className="hover:text-trek-gold flex items-center gap-1.5 text-red-400 font-semibold"><ShieldAlert className="w-4 h-4" /> SOS Alerts</Link>
              </>
            ) : (
              // Admin links
              <>
                <Link to="/admin/dashboard" className="hover:text-trek-gold flex items-center gap-1.5"><LayoutDashboard className="w-4 h-4" /> Dashboard</Link>
                <Link to="/admin/users" className="hover:text-trek-gold flex items-center gap-1.5"><Users className="w-4 h-4" /> Users</Link>
                <Link to="/admin/treks" className="hover:text-trek-gold flex items-center gap-1.5"><Compass className="w-4 h-4" /> Treks</Link>
                <Link to="/admin/bookings" className="hover:text-trek-gold flex items-center gap-1.5"><CalendarCheck className="w-4 h-4" /> Bookings</Link>
                <Link to="/admin/sos" className="hover:text-trek-gold flex items-center gap-1.5 text-red-400"><ShieldAlert className="w-4 h-4" /> SOS</Link>
                <Link to="/admin/analytics" className="hover:text-trek-gold flex items-center gap-1.5"><BarChart3 className="w-4 h-4" /> Analytics</Link>
              </>
            )}

            {user && (
              <div className="flex items-center space-x-3 border-l border-navy-700 pl-4">
                <Link to="/notifications" className="text-slate-300 hover:text-white p-1 rounded-full relative">
                  <Bell className="w-5 h-5" />
                </Link>
                <Link to="/profile" className="flex items-center gap-2 text-slate-200 hover:text-white">
                  <div className="w-8 h-8 rounded-full bg-navy-700 border border-trek-gold/40 flex items-center justify-center font-bold text-xs text-trek-gold">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="max-w-[100px] truncate">{user?.name || 'User'}</span>
                </Link>
                <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 p-1" title="Logout">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-slate-300 hover:text-white">
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-[#132240] border-b border-navy-700 px-4 pt-2 pb-6 space-y-3 text-sm">
          {!user ? (
            <>
              <Link to="/" onClick={() => setMobileOpen(false)} className="block py-2">Home</Link>
              <Link to="/treks" onClick={() => setMobileOpen(false)} className="block py-2">Explore Treks</Link>
              <Link to="/ai" onClick={() => setMobileOpen(false)} className="block py-2 text-trek-gold">AI Assistant</Link>
              <div className="pt-2 border-t border-navy-700 flex flex-col space-y-2">
                <Link to="/login" onClick={() => setMobileOpen(false)} className="text-center py-2 bg-navy-900 rounded">Login</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="text-center py-2 bg-trek-gold text-navy-900 font-semibold rounded">Register</Link>
              </div>
            </>
          ) : (
            <>
              <div className="py-2 text-xs uppercase tracking-wider text-slate-400 font-semibold">{user?.role} Menu</div>
              {user?.role === 'trekker' && (
                <>
                  <Link to="/trekker/dashboard" onClick={() => setMobileOpen(false)} className="block py-1">Dashboard</Link>
                  <Link to="/treks" onClick={() => setMobileOpen(false)} className="block py-1">Explore Treks</Link>
                  <Link to="/trekker/bookings" onClick={() => setMobileOpen(false)} className="block py-1">My Bookings</Link>
                  <Link to="/trekker/reviews" onClick={() => setMobileOpen(false)} className="block py-1 text-amber-400">Reviews & Ratings</Link>
                  <Link to="/trekker/tracking" onClick={() => setMobileOpen(false)} className="block py-1">Live Tracking</Link>
                  <Link to="/trekker/messages" onClick={() => setMobileOpen(false)} className="block py-1">Messages</Link>
                  <Link to="/ai" onClick={() => setMobileOpen(false)} className="block py-1 text-trek-gold">AI Assistant</Link>
                </>
              )}
              {user?.role === 'guide' && (
                <>
                  <Link to="/guide/dashboard" onClick={() => setMobileOpen(false)} className="block py-1">Dashboard</Link>
                  <Link to="/guide/treks" onClick={() => setMobileOpen(false)} className="block py-1">My Treks</Link>
                  <Link to="/guide/participants" onClick={() => setMobileOpen(false)} className="block py-1">Participants</Link>
                  <Link to="/guide/tracking" onClick={() => setMobileOpen(false)} className="block py-1">Live Monitoring</Link>
                  <Link to="/guide/messages" onClick={() => setMobileOpen(false)} className="block py-1">Messages</Link>
                  <Link to="/guide/sos" onClick={() => setMobileOpen(false)} className="block py-1 text-red-400 font-semibold">SOS Alerts</Link>
                </>
              )}
              {user?.role === 'admin' && (
                <>
                  <Link to="/admin/dashboard" onClick={() => setMobileOpen(false)} className="block py-1">Dashboard</Link>
                  <Link to="/admin/users" onClick={() => setMobileOpen(false)} className="block py-1">Users</Link>
                  <Link to="/admin/treks" onClick={() => setMobileOpen(false)} className="block py-1">Treks</Link>
                  <Link to="/admin/bookings" onClick={() => setMobileOpen(false)} className="block py-1">Bookings</Link>
                  <Link to="/admin/sos" onClick={() => setMobileOpen(false)} className="block py-1 text-red-400">SOS</Link>
                  <Link to="/admin/analytics" onClick={() => setMobileOpen(false)} className="block py-1">Analytics</Link>
                </>
              )}
              <div className="pt-3 border-t border-navy-700 flex justify-between items-center">
                <Link to="/profile" onClick={() => setMobileOpen(false)} className="text-slate-200">Profile ({user?.name})</Link>
                <button onClick={handleLogout} className="text-red-400 text-xs flex items-center gap-1"><LogOut className="w-4 h-4"/> Logout</button>
              </div>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
