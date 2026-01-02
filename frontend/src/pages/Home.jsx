/**
 * Home Page
 * 
 * Landing page with hero section and featured campaigns
 */

import { Link } from 'react-router-dom';
import { ArrowRight, Target, Users, TrendingUp } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-400 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fadeIn">
              Fund Your Dreams, Change Lives
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-50 max-w-3xl mx-auto animate-fadeIn">
              Join thousands of creators and backers building the future together.
              Start your campaign or support amazing projects today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fadeIn">
              <Link
                to="/create-campaign"
                className="bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold hover:bg-primary-50 transition-all shadow-lg hover:shadow-xl inline-flex items-center justify-center"
              >
                Start a Campaign
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/campaigns"
                className="bg-primary-700 text-white px-8 py-4 rounded-lg font-semibold hover:bg-primary-800 transition-all shadow-lg hover:shadow-xl"
              >
                Explore Campaigns
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-lg bg-gradient-to-br from-primary-50 to-white border border-primary-100">
              <div className="bg-primary-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8" />
              </div>
              <h3 className="text-4xl font-bold text-primary-600 mb-2">1000+</h3>
              <p className="text-gray-600 font-medium">Successful Campaigns</p>
            </div>

            <div className="text-center p-6 rounded-lg bg-gradient-to-br from-primary-50 to-white border border-primary-100">
              <div className="bg-primary-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-4xl font-bold text-primary-600 mb-2">50K+</h3>
              <p className="text-gray-600 font-medium">Active Backers</p>
            </div>

            <div className="text-center p-6 rounded-lg bg-gradient-to-br from-primary-50 to-white border border-primary-100">
              <div className="bg-primary-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8" />
              </div>
              <h3 className="text-4xl font-bold text-primary-600 mb-2">$10M+</h3>
              <p className="text-gray-600 font-medium">Total Raised</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Create Campaign</h3>
              <p className="text-gray-600">
                Set up your campaign with a compelling story and funding goal.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Share & Promote</h3>
              <p className="text-gray-600">
                Share your campaign with friends, family, and social networks.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Receive Funding</h3>
              <p className="text-gray-600">
                Get funded by backers who believe in your project.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 text-primary-50">
            Join our community and bring your ideas to life.
          </p>
          <Link
            to="/register"
            className="bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold hover:bg-primary-50 transition-all shadow-lg hover:shadow-xl inline-flex items-center"
          >
            Create Your Account
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;

