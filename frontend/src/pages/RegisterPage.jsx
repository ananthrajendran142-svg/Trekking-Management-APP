import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mountain, Mail, Lock, User, Phone, ShieldCheck, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('trekker');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const regUser = await register(name, email, password, confirmPassword, phone, role);
      if (regUser.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (regUser.role === 'guide') {
        navigate('/guide/dashboard');
      } else {
        navigate('/trekker/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl w-full bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        
        {/* LEFT SIDE HERO BANNER */}
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
              <ShieldCheck className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black tracking-tight text-white">Create Account</h3>
            <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
              Join as a Trekker, Guide, or Admin to access GPS telemetry, gear checklists, and emergency rescue.
            </p>
          </div>

          <div className="relative z-10 text-xs text-slate-400 text-center">
            Integrated High-Altitude Management
          </div>
        </div>

        {/* RIGHT SIDE FORM CARD */}
        <div className="p-8 sm:p-10 flex flex-col justify-center space-y-5">
          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold text-navy-900">Register Account</h2>
            <p className="text-xs text-slate-500">Sign up to start your adventure</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-xs font-semibold rounded-xl border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            
            <div>
              <label className="block text-xs font-bold text-navy-900 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="Alexander Wright"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-navy-900 focus:outline-none focus:border-trek-blue font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1">Email address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="alex@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-navy-900 focus:outline-none focus:border-trek-blue font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="+1 555-0199"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-navy-900 focus:outline-none focus:border-trek-blue font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-xs font-bold text-navy-900 mb-1">Account Role</label>
              <div className="grid grid-cols-3 gap-2">
                {['trekker', 'guide', 'admin'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-extrabold capitalize transition ${
                      role === r ? 'bg-[#070D1B] text-white border-[#070D1B] shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1">Password</label>
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

              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-navy-900 focus:outline-none focus:border-trek-blue font-medium"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#DF9F35] hover:bg-[#c98c2a] text-[#070D1B] font-black text-xs rounded-xl shadow-md transition uppercase tracking-wide flex items-center justify-center gap-2 mt-2"
            >
              <span>{loading ? 'Registering...' : 'Register Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center pt-1 text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-trek-blue hover:underline">
              Log in
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}

