import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

// Load Razorpay script dynamically
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const DonateModal = ({ isOpen, onClose, campaign, onDonationSuccess }) => {
  // Form state
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Load Razorpay script when modal opens
  useEffect(() => {
    if (isOpen) {
      loadRazorpayScript().then((loaded) => {
        setScriptLoaded(loaded);
        if (!loaded) {
          toast.error('Failed to load payment gateway. Please refresh the page.');
        }
      });
    }
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setAmount('');
      setMessage('');
      setAnonymous(false);
      setLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate amount
    const donationAmount = parseFloat(amount);
    if (!donationAmount || donationAmount < 1) {
      toast.error('Please enter a valid amount (minimum ₹1)');
      return;
    }

    if (!scriptLoaded || !window.Razorpay) {
      toast.error('Payment gateway not loaded. Please refresh and try again.');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create order on backend
      const { data: orderData } = await api.post('/payments/create-order', {
        amount: donationAmount,
        campaignId: campaign._id,
      });

      if (!orderData.success) {
        throw new Error(orderData.message || 'Failed to create payment order');
      }

      // Step 2: Configure Razorpay checkout options
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'SeedLing',
        description: `Donation to ${campaign.title}`,
        order_id: orderData.orderId,
        image: '/favicon.svg', // Your logo
        handler: async function (response) {
          // Payment successful - verify on backend
          try {
            const { data: verifyData } = await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              campaignId: campaign._id,
              amount: donationAmount,
              message: message,
              anonymous: anonymous,
            });

            if (verifyData.success) {
              toast.success('Payment successful! Thank you for your donation! 🙏');

              // Close modal
              onClose();

              // Refresh campaign data
              if (onDonationSuccess) {
                onDonationSuccess();
              }
            } else {
              toast.error(verifyData.message || 'Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error(
              error.response?.data?.message ||
                'Payment verification failed. Please contact support if amount was deducted.'
            );
          }
        },
        prefill: {
          name: '', // Can be filled from user profile if available
          email: '', // Can be filled from user profile if available
          contact: '',
        },
        notes: {
          campaignId: campaign._id,
          campaignTitle: campaign.title,
        },
        theme: {
          color: '#2563eb', // Primary blue color matching your theme
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            toast('Payment cancelled. You can try again anytime.', {
              icon: 'ℹ️',
            });
          },
        },
      };

      // Step 3: Open Razorpay checkout
      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', function (response) {
        toast.error(
          `Payment failed: ${response.error.description || 'Please try again'}`
        );
        setLoading(false);
      });

      rzp.open();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          'Something went wrong. Please try again.'
      );
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full shadow-xl transition-colors">
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
          Donate to {campaign.title}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Goal: ₹{campaign.goalAmount?.toLocaleString()} | Raised: ₹
          {campaign.currentAmount?.toLocaleString()}
        </p>

        <form onSubmit={handleSubmit}>
          {/* Amount Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Donation Amount (₹) *
            </label>
            <input
              type="number"
              placeholder="Enter amount in INR"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none transition-colors"
              required
              disabled={loading}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Minimum ₹1. Payments are in Indian Rupees (INR)
            </p>
          </div>

          {/* Message Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Message (Optional)
            </label>
            <textarea
              placeholder="Leave an encouraging message..."
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none resize-none transition-colors"
              disabled={loading}
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
                disabled={loading}
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Make this donation anonymous
              </span>
            </label>
          </div>

          {/* Test Mode Notice */}
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-400">
              <strong>Test Mode:</strong> Use Razorpay test cards like{' '}
              <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">5267 3181 8797 5449</code>{' '}
              (any future date, any CVV) to simulate payments.
            </p>
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
              className="flex-1 px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
              disabled={loading || !amount}
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
