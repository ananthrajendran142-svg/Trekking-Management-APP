import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mountain, Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loggedUser = await login(email, password);
      if (loggedUser.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (loggedUser.role === 'guide') {
        navigate('/guide/dashboard');
      } else {
        navigate('/trekker/dashboard');
      }
    } catch (err) {
      const errDetail = err.response?.data?.error;
      setError(typeof errDetail === 'string' ? errDetail : 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl w-full bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        
        {/* LEFT SIDE HERO BANNER (IMAGE 2 #4) */}
        <div className="relative bg-[#070D1B] text-white p-8 sm:p-12 flex flex-col justify-between overflow-hidden hidden md:flex">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070D1B] via-[#070D1B]/70 to-transparent" />

          <div className="relative z-10 space-y-2">
            <Link to="/" className="inline-flex items-center gap-2 font-black text-2xl text-white">
              <div className="p-2 bg-gradient-to-tr from-trek-blue via-blue-600 to-[#DF9F35] rounded-xl shadow-md">
                <Mountain className="w-6 h-6 text-white" />
              </div>
              <span className="tracking-tight">Trek<span className="text-[#DF9F35]">Mate</span></span>
            </Link>
          </div>

          <div className="relative z-10 space-y-3 my-auto py-12 text-center">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto border border-white/20 text-[#DF9F35]">
              <Mountain className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black tracking-tight text-white">TrekMate</h3>
            <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
              Your next mountain adventure is waiting. Monitor satellite telemetry & weather live.
            </p>
          </div>

          <div className="relative z-10 text-xs text-slate-400 text-center">
            Integrated High-Altitude Management
          </div>
        </div>

        {/* RIGHT SIDE FORM CARD */}
        <div className="p-8 sm:p-10 flex flex-col justify-center space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-2xl font-extrabold text-navy-900">Welcome Back</h2>
            <p className="text-xs text-slate-500">Sign in to your account</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-xs font-semibold rounded-xl border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-navy-900 mb-1">Email address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="alexander@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-navy-900 focus:outline-none focus:border-trek-blue font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-navy-900">Password</label>
                <a href="#forgot" onClick={(e) => { e.preventDefault(); alert("Use sample logins: trekker@trekmate.com / trekker123"); }} className="text-[11px] text-trek-blue hover:underline font-medium">Forgot password?</a>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-navy-900 focus:outline-none focus:border-trek-blue font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#0A1428] hover:bg-trek-blue text-white font-extrabold rounded-xl shadow-md transition text-xs flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Signing in...' : 'Login'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Social Logins */}
          <div className="space-y-3 pt-2">
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[10px] text-slate-400 uppercase font-bold shrink-0">Or continue with</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { setEmail('trekker@trekmate.com'); setPassword('trekker123'); }}
                className="py-2 px-3 border border-slate-200 rounded-xl text-xs font-bold text-navy-900 hover:bg-slate-50 transition flex items-center justify-center gap-2"
              >
                <span>Demo Trekker</span>
              </button>
              <button
                type="button"
                onClick={() => { setEmail('guide@trekmate.com'); setPassword('guide123'); }}
                className="py-2 px-3 border border-slate-200 rounded-xl text-xs font-bold text-navy-900 hover:bg-slate-50 transition flex items-center justify-center gap-2"
              >
                <span>Demo Guide</span>
              </button>
            </div>
          </div>

          <div className="text-center pt-2 text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-trek-blue hover:underline">
              Register
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}

