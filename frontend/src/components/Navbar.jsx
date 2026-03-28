/**
 * Navbar Component
 * 
 * Top navigation bar with logo, links, and auth buttons
 * Shows different options based on authentication state
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { List, PlusCircle, LayoutDashboard, LogOut, User, Sun, Moon } from 'lucide-react';
import toast from 'react-hot-toast';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => {
    if(theme === 'light'){
      document.documentElement.classList.add('dark');
      setTheme('dark');
    }
    else{
      document.documentElement.classList.remove('dark');
      setTheme('light');
    }
    console.log('theme changed to', theme);
  }

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-700 sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="logo-icon">
              <div className="logo-icon-sprout">
                <div className="logo-icon-stem"></div>
                <div className="logo-icon-leaf logo-icon-leaf-left"></div>
                <div className="logo-icon-leaf logo-icon-leaf-right"></div>
              </div>
            </div>
            <div className="logo-wrapper">
              <span className="logo-text">
                <span className="logo-seed">SEED</span>
                <span className="logo-l">L</span>
                <span className="logo-i">
                  <span className="logo-i-stem">I</span>
                  <span className="logo-i-dot"></span>
                </span>
                <span className="logo-ng">NG</span>
              </span>
              <span className="logo-subtitle">a crowdfund application</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors border border-gray-300 dark:border-gray-600 rounded-md p-2 mr-2"
            >
              {theme === "light" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            {/* Campaigns Link */}
            <Link
              to="/campaigns"
              className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <List className="h-5 w-5" />
              <span>Campaigns</span>
            </Link>

            {user ? (
              <>
                <Link
                  to="/create-campaign"
                  className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <PlusCircle className="h-5 w-5" />
                  <span>Start Campaign</span>
                </Link>

                <Link
                  to="/dashboard"
                  className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <LayoutDashboard className="h-5 w-5" />
                  <span>Dashboard</span>
                </Link>

                {/* User Menu */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-200">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt="User Avatar"
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                    <Link
                      to="/profile"
                      className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      <span className="font-medium hover:underline cursor-pointer font-bold">
                        {user.name}
                      </span>
                    </Link>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-500 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-primary-600 to-primary-500 text-white px-6 py-2 rounded-lg hover:from-primary-700 hover:to-primary-600 transition-all shadow-md hover:shadow-lg"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

