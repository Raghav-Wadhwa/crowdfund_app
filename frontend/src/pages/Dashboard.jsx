/**
 * Dashboard Page (Protected)
 * 
 * User's personal dashboard showing their campaigns and stats
 */

import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Welcome, {user?.name}!</h1>
          <p className="text-gray-600 mt-2">Manage your campaigns and view your activity</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-600 text-sm font-medium mb-2">My Campaigns</h3>
            <p className="text-3xl font-bold text-gray-900">0</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Total Raised</h3>
            <p className="text-3xl font-bold text-green-600">$0</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Donations Made</h3>
            <p className="text-3xl font-bold text-primary-600">0</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600">Dashboard features coming soon!</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

