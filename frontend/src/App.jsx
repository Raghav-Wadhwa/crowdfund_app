/**
 * Main App Component
 *
 * Sets up routing and provides global context
 * Includes "Smart Warmup" - checks if backend is awake first
 */

import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import api from './utils/api';

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

  // Server status: 'checking' | 'awake' | 'waking'
  const [serverStatus, setServerStatus] = useState(() => {
    // Skip in development - backend is always available locally
    if (import.meta.env.DEV) return 'awake';
    // Check if already confirmed awake this session
    if (sessionStorage.getItem('serverAwake') === 'true') return 'awake';
    return 'checking';
  });

  // Check server status on mount
  useEffect(() => {
    if (serverStatus !== 'checking') return;

    const checkServer = async () => {
      try {
        // Quick health check with 3 second timeout
        await api.get('/health', { timeout: 3000 });
        // Server is awake!
        sessionStorage.setItem('serverAwake', 'true');
        setServerStatus('awake');
        console.log('✅ Server is awake - no warmup needed');
      } catch (error) {
        // Server is sleeping, need to wake it up
        console.log('⏳ Server is sleeping - showing warmup loader');
        setServerStatus('waking');
      }
    };

    checkServer();
  }, [serverStatus]);

  // Handle warmup completion
  const handleWarmupComplete = () => {
    sessionStorage.setItem('serverAwake', 'true');
    setServerStatus('awake');
  };

  // Show checking state briefly while we verify server
  if (serverStatus === 'checking') {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Checking server...</p>
      </div>
    );
  }

  // Show warmup loader only if server is actually waking up
  if (serverStatus === 'waking') {
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
