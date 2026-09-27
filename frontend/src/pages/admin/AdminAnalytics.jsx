import React, { useState, useEffect } from 'react';
import api from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, TrendingUp, Users, Compass, DollarSign } from 'lucide-react';

export default function AdminAnalytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const resp = await api.get('/admin/analytics');
      setStats(resp.data);
    } catch (err) {
      console.error("Fetch admin analytics error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Calculating database analytics charts..." />;

  const userData = stats ? [
    { name: 'Trekkers', count: stats.users.trekkers },
    { name: 'Guides', count: stats.users.guides },
    { name: 'Admins', count: stats.users.admins },
  ] : [];

  const trekData = stats ? [
    { name: 'Published', count: stats.treks.published },
    { name: 'Active', count: stats.treks.active },
    { name: 'Completed', count: stats.treks.completed },
    { name: 'Draft', count: stats.treks.draft },
  ] : [];

  const COLORS = ['#1E5AA8', '#C9A24B', '#10B981', '#EF4444'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <div className="bg-navy-900 text-white rounded-3xl p-8 border border-navy-800">
        <span className="text-xs font-bold uppercase tracking-wider text-trek-gold">Database Telemetry</span>
        <h1 className="text-3xl font-extrabold mt-1">Platform Analytics</h1>
        <p className="text-sm text-slate-300">Visual breakdown computed directly from current database tables.</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* USER ROLES BREAKDOWN CHART */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-navy-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-trek-blue" /> Users Distribution by Role
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userData}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1E5AA8" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* TREKS STATUS BREAKDOWN CHART */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-navy-900 flex items-center gap-2">
              <Compass className="w-5 h-5 text-trek-gold" /> Expedition Status Distribution
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={trekData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="count"
                    label={({ name, count }) => `${name}: ${count}`}
                  >
                    {trekData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
