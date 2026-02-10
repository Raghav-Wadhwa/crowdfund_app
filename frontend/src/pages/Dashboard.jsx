/**
 * Dashboard Page (Protected)
 * 
 * User's personal dashboard showing their campaigns and stats
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Calendar, Shield } from 'lucide-react';
import api from '../utils/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    campaignsCreated: 0,
    totalRaised: 0,
    donationsMade: 0,
    totalDonated: 0,
  });
  const [loading, setLoading] = useState(true);
  
  // Fetch user statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/auth/stats');
        if (response.data.success) {
          setStats(response.data.stats);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);
  
  // Print user details to console
  console.log('👤 User Details:', user);
  console.log('📊 User Stats:', stats);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Welcome, {user?.name}!</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your campaigns and view your activity</p>
        </div>

        {/* User Details Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-700 p-6 mb-8 transition-colors">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Account Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}


            {/* Email */}
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Mail className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{user?.email}</p>
              </div>
            </div>


            {/* Member Since */}
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Member Since</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-700 p-6 transition-colors">
            <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">My Campaigns</h3>
            {loading ? (
              <div className="animate-pulse h-10 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            ) : (
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.campaignsCreated}</p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total campaigns created</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-700 p-6 transition-colors">
            <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Total Raised</h3>
            {loading ? (
              <div className="animate-pulse h-10 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            ) : (
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                ${stats.totalRaised.toLocaleString()}
              </p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">From all your campaigns</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-700 p-6 transition-colors">
            <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Donations Made</h3>
            {loading ? (
              <div className="animate-pulse h-10 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            ) : (
              <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">{stats.donationsMade}</p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Total donated: ${stats.totalDonated.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-700 p-8 text-center transition-colors">
          <p className="text-gray-600 dark:text-gray-400">Dashboard features coming soon!</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Campaign management, donation history, and analytics</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

