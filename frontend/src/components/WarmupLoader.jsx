/**
 * Warmup Loader Component
 *
 * Shows a loading screen for ~60 seconds on app startup to allow
 * free Render backend instance to wake up before users try to log in.
 *
 * Features:
 * - Progress bar with percentage (fills over 60s)
 * - Console flag to skip: window.skipWarmup = true
 * - Backend health checks during warmup
 * - Skip button for impatient users
 */

import { useState, useEffect, useRef } from 'react';
import { Sprout, Activity, Server, Wifi } from 'lucide-react';
import api from '../utils/api';

const WarmupLoader = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Waking up the server...');
  const [backendReady, setBackendReady] = useState(false);
  const [canSkip, setCanSkip] = useState(false);
  const [messages, setMessages] = useState([
    'Connecting to database...',
    'Warming up the server...',
    'Preparing services...',
    'Almost there...',
  ]);
  const intervalRef = useRef(null);
  const checkIntervalRef = useRef(null);

  // Total warmup time: 30 seconds (reduced from 60s)
  const TOTAL_TIME = 30000;
  const UPDATE_INTERVAL = 500; // Update every 500ms
  const PROGRESS_PER_TICK = (100 / (TOTAL_TIME / UPDATE_INTERVAL));

  // Console skip flag
  useEffect(() => {
    // Expose skip function to console
    window.skipWarmup = () => {
      console.log('⏩ Skipping warmup via console command');
      clearInterval(intervalRef.current);
      clearInterval(checkIntervalRef.current);
      onComplete();
    };

    // Also check for flag
    if (window.__SKIP_WARMUP__) {
      console.log('⏩ Warmup skipped via __SKIP_WARMUP__ flag');
      onComplete();
    }

    return () => {
      window.skipWarmup = undefined;
    };
  }, [onComplete]);

  // Progress bar animation
  useEffect(() => {
    let currentProgress = 0;

    intervalRef.current = setInterval(() => {
      currentProgress += PROGRESS_PER_TICK;

      // Update status messages based on progress
      if (currentProgress < 20) {
        setStatus(messages[0]);
      } else if (currentProgress < 40) {
        setStatus(messages[1]);
      } else if (currentProgress < 70) {
        setStatus(messages[2]);
      } else if (currentProgress < 90) {
        setStatus(messages[3]);
      } else {
        setStatus(backendReady ? 'Ready! 🎉' : 'Finalizing...');
      }

      // Enable skip button after ~10 seconds (33% of 30s)
      if (currentProgress > 33) {
        setCanSkip(true);
      }

      // Cap at 95% until backend confirms ready
      if (currentProgress >= 95 && !backendReady) {
        currentProgress = 95;
      }

      setProgress(Math.min(currentProgress, 100));

      // Complete when progress hits 100
      if (currentProgress >= 100) {
        clearInterval(intervalRef.current);
        clearInterval(checkIntervalRef.current);
        setTimeout(onComplete, 500);
      }
    }, UPDATE_INTERVAL);

    return () => {
      clearInterval(intervalRef.current);
    };
  }, [backendReady, messages, onComplete]);

  // Backend health checks
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await api.get('/health', { timeout: 5000 });
        if (response.data?.status === 'ok') {
          setBackendReady(true);
          setStatus('Server is ready! 🚀');
          console.log('✅ Backend is awake!');
        }
      } catch (error) {
        // Backend still waking up, that's expected
        console.log('⏳ Backend still starting...');
      }
    };

    // Check immediately
    checkBackend();

    // Then check every 10 seconds
    checkIntervalRef.current = setInterval(checkBackend, 10000);

    return () => {
      clearInterval(checkIntervalRef.current);
    };
  }, []);

  const handleSkip = () => {
    clearInterval(intervalRef.current);
    clearInterval(checkIntervalRef.current);
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-primary-50 to-white dark:from-gray-900 dark:to-gray-800 z-50 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4 animate-pulse">
          <Sprout className="h-10 w-10 text-primary-600 dark:text-primary-400" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          SeedLing
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Crowdfunding Platform
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8 max-w-md w-full">
        <div className={`flex flex-col items-center p-3 rounded-lg transition-colors ${
          progress > 10 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'
        }`}>
          <Server className={`h-6 w-6 ${
            progress > 10 ? 'text-green-600 dark:text-green-400' : 'text-gray-400'
          }`} />
          <span className="text-xs mt-2 text-gray-600 dark:text-gray-400">Instance</span>
        </div>
        <div className={`flex flex-col items-center p-3 rounded-lg transition-colors ${
          progress > 40 ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-800'
        }`}>
          <Activity className={`h-6 w-6 ${
            progress > 40 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
          }`} />
          <span className="text-xs mt-2 text-gray-600 dark:text-gray-400">Services</span>
        </div>
        <div className={`flex flex-col items-center p-3 rounded-lg transition-colors ${
          backendReady ? 'bg-green-100 dark:bg-green-900/30' : progress > 70 ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-gray-100 dark:bg-gray-800'
        }`}>
          <Wifi className={`h-6 w-6 ${
            backendReady ? 'text-green-600 dark:text-green-400' : progress > 70 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-400'
          }`} />
          <span className="text-xs mt-2 text-gray-600 dark:text-gray-400">
            {backendReady ? 'Ready' : 'API'}
          </span>
        </div>
      </div>

      {/* Progress Section */}
      <div className="w-full max-w-md">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {status}
          </span>
          <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
            {Math.round(progress)}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-primary-500 to-primary-400 h-3 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          >
            <div className="w-full h-full bg-white/20 animate-pulse" />
          </div>
        </div>

        {/* Time Estimate */}
        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mb-6">
          {progress < 100
            ? `Estimated time: ${Math.ceil((100 - progress) / 100 * 30)}s remaining`
            : 'Starting up...'}
        </p>
      </div>

      {/* Info Box */}
      <div className="max-w-md w-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-700 dark:text-blue-400">
          <strong>Why the wait?</strong> We're warming up our servers to give you the best experience. 
          This only happens once when the app first loads.
        </p>
      </div>

      {/* Skip Button */}
      <div className="flex gap-4">
        <button
          onClick={handleSkip}
          disabled={!canSkip}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            canSkip
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
          }`}
        >
          {canSkip ? 'Skip & Continue →' : 'Please wait...'}
        </button>
      </div>

      {/* Console Hint */}
      <p className="mt-8 text-xs text-gray-400 dark:text-gray-600 text-center">
        Developer? Run <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">skipWarmup()</code> in console to skip instantly
      </p>
    </div>
  );
};

export default WarmupLoader;
