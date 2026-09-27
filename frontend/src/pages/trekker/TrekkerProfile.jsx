import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { User, Mail, Phone, ShieldCheck, CheckCircle2, Save } from 'lucide-react';

export default function TrekkerProfile() {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const resp = await api.put('/users/profile', { name, phone });
      updateUser(resp.data.user);
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError('Failed to update profile details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      
      {/* HEADER */}
      <div className="bg-navy-900 text-white rounded-3xl p-8 border border-navy-800 flex items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-trek-blue to-trek-gold text-navy-900 font-extrabold flex items-center justify-center text-2xl shadow-xl">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-trek-gold">{user?.role} Account</span>
          <h1 className="text-2xl font-extrabold">{user?.name}</h1>
          <p className="text-xs text-slate-300">{user?.email}</p>
        </div>
      </div>

      {/* EDIT FORM */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-navy-900 border-b border-slate-100 pb-3">Personal Details</h2>

        {successMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {successMsg}
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-xs font-medium rounded-xl border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-navy-900 mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-navy-900 focus:outline-none focus:border-trek-blue"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-900 mb-1">Email (Read Only)</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-900 mb-1">Phone Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-navy-900 focus:outline-none focus:border-trek-blue"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-navy-900 hover:bg-trek-blue text-white font-bold rounded-xl text-xs shadow transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </form>
      </div>

    </div>
  );
}
