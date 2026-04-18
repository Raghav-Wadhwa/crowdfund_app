/**
 * Main App Component
 *
 * Sets up routing and provides global context
 */

import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Campaigns from './pages/Campaigns';
import CampaignDetail from './pages/CampaignDetail';
import CreateCampaign from './pages/CreateCampaign';
import EditCampaign from './pages/EditCampaign';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import WarmupLoader from './components/WarmupLoader';

function App() {
  // Use /crowdfund_app for GitHub Pages, / for local development
  const basename = import.meta.env.BASE_URL || '/';

  // Warmup loader state - check if already completed in this session
  const [warmupComplete, setWarmupComplete] = useState(() => {
    // Skip warmup in development
    if (import.meta.env.DEV) return true;
    // Check if already warmed up this session
    return sessionStorage.getItem('warmupComplete') === 'true';
  });

  // Expose flag to window for console skip
  useEffect(() => {
    window.__SKIP_WARMUP__ = false;
  }, []);

  const handleWarmupComplete = () => {
    sessionStorage.setItem('warmupComplete', 'true');
    setWarmupComplete(true);
  };

  // Show warmup loader on initial load (production only)
  if (!warmupComplete) {
    return <WarmupLoader onComplete={handleWarmupComplete} />;
  }

  return (
    <AuthProvider>
      <Router basename={basename}>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/campaigns/:id" element={<CampaignDetail />} />

            {/* Protected routes */}
            <Route
              path="/create-campaign"
              element={
                <ProtectedRoute>
                  <CreateCampaign />
                </ProtectedRoute>
              }
            />
            <Route
              path="/campaigns/:id/edit"
              element={
                <ProtectedRoute>
                  <EditCampaign />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
              />
          </Routes>

          {/* Toast notifications */}
          <Toaster position="top-right" />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
