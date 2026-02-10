import React, { useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

// Step 1: Component receives props from parent
const DonateModal = ({ isOpen, onClose, campaign, onDonationSuccess }) => {
  
  // Step 3: Create state for form inputs
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);

  // Step 4: Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent page refresh

    // Validate amount
    if (!amount || amount < 1) {
      toast.error('Please enter a valid amount');
      return;
    }


    setLoading(true);

    try {
      // Step 5: Call API to create donation
      await api.post('/donations', {
        campaign: campaign._id,  // Backend expects 'campaign', not 'campaignId'
        amount: parseFloat(amount),
        message: message,
        anonymous: anonymous,
      });

      toast.success('Donation successful! Thank you!');
      
      // Clear form
      setAmount('');
      setMessage('');
      setAnonymous(false);
      
      // Close modal
      onClose();
      
      // Refresh campaign data
      if (onDonationSuccess) {
        onDonationSuccess();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Donation failed');
    } finally {
      setLoading(false);
    }
  };
  
  // Step 2: Modal only shows if isOpen is true
  if (!isOpen) return null;

  return (
    // Step 3: Modal backdrop (dark overlay)
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex justify-center items-center z-50 p-4">
      {/* Step 4: Modal content box */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full shadow-xl transition-colors">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Donate to {campaign.title}</h2>

        <form onSubmit={handleSubmit}>
            {/* Amount Input */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Donation Amount ($) *
                </label>
                <input 
                  type="number" 
                  placeholder="Enter amount" 
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none transition-colors"
                  required
                />
            </div>

            {/* Message Input */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message (Optional)
                </label>
                <textarea 
                  placeholder="Leave a message..." 
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none resize-none transition-colors"
                ></textarea>
            </div>

            {/* Anonymous Checkbox */}
            <div className="mb-4">
                <label className="flex items-center">
                  <input 
                    type="checkbox"
                    checked={anonymous}
                    onChange={(e) => setAnonymous(e.target.checked)}
                    className="h-4 w-4 text-primary-600 dark:text-primary-500 focus:ring-primary-500 dark:focus:ring-primary-400 border-gray-300 dark:border-gray-600 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Make this donation anonymous</span>
                </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Donate Now'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default DonateModal;
