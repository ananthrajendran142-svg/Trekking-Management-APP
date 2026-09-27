import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Public Pages
import LandingPage from './pages/LandingPage';
import TrekDiscovery from './pages/TrekDiscovery';
import TrekDetails from './pages/TrekDetails';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

import LoadingSpinner from './components/LoadingSpinner';

// Trekker Pages
import TrekkerDashboard from './pages/trekker/TrekkerDashboard';
import MyBookings from './pages/trekker/MyBookings';
import BookingCheckout from './pages/trekker/BookingCheckout';
import LiveTracking from './pages/trekker/LiveTracking';
import TrekkerMessages from './pages/trekker/TrekkerMessages';
import TrekkerReviews from './pages/trekker/TrekkerReviews';
import AIAssistant from './pages/trekker/AIAssistant';
import TrekkerNotifications from './pages/trekker/TrekkerNotifications';
import TrekkerProfile from './pages/trekker/TrekkerProfile';

// Guide Pages
import GuideDashboard from './pages/guide/GuideDashboard';
import CreateTrek from './pages/guide/CreateTrek';
import EditTrek from './pages/guide/EditTrek';
import ManageTreks from './pages/guide/ManageTreks';
import ParticipantManagement from './pages/guide/ParticipantManagement';
import LiveMonitoring from './pages/guide/LiveMonitoring';
import GuideMessages from './pages/guide/GuideMessages';
import GuideSOSAlerts from './pages/guide/GuideSOSAlerts';
import GuideWeather from './pages/guide/GuideWeather';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUserManagement from './pages/admin/AdminUserManagement';
import AdminTrekManagement from './pages/admin/AdminTrekManagement';
import AdminBookings from './pages/admin/AdminBookings';
import AdminSOSMonitoring from './pages/admin/AdminSOSMonitoring';
import AdminReviews from './pages/admin/AdminReviews';
import AdminAnalytics from './pages/admin/AdminAnalytics';

// Role Guard Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner message="Authenticating session..." />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function AppRoutes() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
        <LoadingSpinner message="Restoring TrekMate session..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FA]">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/treks" element={<TrekDiscovery />} />
          <Route path="/treks/:id" element={<TrekDetails />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/ai" element={<AIAssistant />} />
          <Route path="/notifications" element={<TrekkerNotifications />} />
          <Route path="/profile" element={<TrekkerProfile />} />

          {/* Trekker Routes */}
          <Route path="/trekker/dashboard" element={<ProtectedRoute allowedRoles={['trekker', 'guide', 'admin']}><TrekkerDashboard /></ProtectedRoute>} />
          <Route path="/trekker/bookings" element={<ProtectedRoute allowedRoles={['trekker', 'guide', 'admin']}><MyBookings /></ProtectedRoute>} />
          <Route path="/trekker/checkout" element={<ProtectedRoute allowedRoles={['trekker', 'guide', 'admin']}><BookingCheckout /></ProtectedRoute>} />
          <Route path="/trekker/tracking" element={<ProtectedRoute allowedRoles={['trekker', 'guide', 'admin']}><LiveTracking /></ProtectedRoute>} />
          <Route path="/trekker/messages" element={<ProtectedRoute allowedRoles={['trekker', 'guide', 'admin']}><TrekkerMessages /></ProtectedRoute>} />
          <Route path="/trekker/reviews" element={<ProtectedRoute allowedRoles={['trekker', 'guide', 'admin']}><TrekkerReviews /></ProtectedRoute>} />

          {/* Guide Routes */}
          <Route path="/guide/dashboard" element={<ProtectedRoute allowedRoles={['guide', 'admin']}><GuideDashboard /></ProtectedRoute>} />
          <Route path="/guide/treks" element={<ProtectedRoute allowedRoles={['guide', 'admin']}><ManageTreks /></ProtectedRoute>} />
          <Route path="/guide/treks/create" element={<ProtectedRoute allowedRoles={['guide', 'admin']}><CreateTrek /></ProtectedRoute>} />
          <Route path="/guide/treks/:id/edit" element={<ProtectedRoute allowedRoles={['guide', 'admin']}><EditTrek /></ProtectedRoute>} />
          <Route path="/guide/participants" element={<ProtectedRoute allowedRoles={['guide', 'admin']}><ParticipantManagement /></ProtectedRoute>} />
          <Route path="/guide/tracking" element={<ProtectedRoute allowedRoles={['trekker', 'guide', 'admin']}><LiveMonitoring /></ProtectedRoute>} />
          <Route path="/guide/messages" element={<ProtectedRoute allowedRoles={['guide', 'admin']}><GuideMessages /></ProtectedRoute>} />
          <Route path="/guide/sos" element={<ProtectedRoute allowedRoles={['guide', 'admin']}><GuideSOSAlerts /></ProtectedRoute>} />
          <Route path="/guide/weather" element={<ProtectedRoute allowedRoles={['guide', 'admin']}><GuideWeather /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUserManagement /></ProtectedRoute>} />
          <Route path="/admin/treks" element={<ProtectedRoute allowedRoles={['admin']}><AdminTrekManagement /></ProtectedRoute>} />
          <Route path="/admin/bookings" element={<ProtectedRoute allowedRoles={['admin']}><AdminBookings /></ProtectedRoute>} />
          <Route path="/admin/sos" element={<ProtectedRoute allowedRoles={['admin']}><AdminSOSMonitoring /></ProtectedRoute>} />
          <Route path="/admin/reviews" element={<ProtectedRoute allowedRoles={['admin']}><AdminReviews /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['admin']}><AdminAnalytics /></ProtectedRoute>} />

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
