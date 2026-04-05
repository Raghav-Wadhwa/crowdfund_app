/**
 * OTP Verification Component
 *
 * Handles email verification via 6-digit OTP code.
 * Used after registration and during login for unverified users.
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Mail, ArrowRight, RefreshCw, Check } from 'lucide-react';

const OTPVerification = ({ email, onBack, emailSent = true }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [lastEmailSent, setLastEmailSent] = useState(emailSent);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const { login } = useAuth();

  // Start resend countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleChange = (index, value) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (index === 5 && value) {
      const fullOtp = [...newOtp.slice(0, 5), value].join('');
      if (fullOtp.length === 6) {
        setTimeout(() => handleVerify(fullOtp), 100);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    const digits = pastedData.replace(/\D/g, '').split('');

    const newOtp = [...otp];
    digits.forEach((digit, i) => {
      if (i < 6) newOtp[i] = digit;
    });
    setOtp(newOtp);

    // Focus the appropriate input
    const focusIndex = Math.min(digits.length, 5);
    inputRefs.current[focusIndex]?.focus();

    // Auto-submit if complete
    if (digits.length === 6) {
      setTimeout(() => handleVerify(digits.join('')), 100);
    }
  };

  const handleVerify = async (fullOtp) => {
    const code = fullOtp || otp.join('');

    if (code.length !== 6) {
      toast.error('Please enter all 6 digits');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/verify-otp', {
        email,
        otp: code,
      });

      if (response.data.success) {
        toast.success('Email verified successfully! Welcome to SeedLing!');

        // Log the user in
        login(response.data.token, response.data.user);

        // Navigate to dashboard
        navigate('/dashboard');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Verification failed';
      toast.error(message);

      // Clear OTP inputs on error
      if (error.response?.data?.message?.includes('attempts')) {
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setResendLoading(true);

    try {
      const response = await api.post('/auth/resend-otp', { email });

      if (response.data.success) {
        const wasEmailSent = response.data.emailSent;
        setLastEmailSent(wasEmailSent);

        if (wasEmailSent) {
          toast.success('New verification code sent!');
        } else {
          toast.success('New code generated! Check with administrator.');
        }
        setResendTimer(60);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to resend code';
      toast.error(message);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Icon */}
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
          <Mail className="w-8 h-8 text-primary-600" />
        </div>
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
        Verify Your Email
      </h2>
      <p className="text-gray-600 text-center mb-4">
        Enter the 6-digit code sent to{' '}
        <span className="font-medium text-gray-900">{email}</span>
      </p>

      {/* Warning if email wasn't sent */}
      {!lastEmailSent && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
          <p className="text-amber-800 text-sm text-center">
            ⚠️ Email delivery failed. Please contact the administrator for your verification code.
          </p>
        </div>
      )}

      {/* OTP Inputs */}
      <div className="flex justify-center gap-2 mb-8">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            maxLength="1"
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={loading}
            className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
            autoFocus={index === 0}
          />
        ))}
      </div>

      {/* Verify Button */}
      <button
        onClick={() => handleVerify()}
        disabled={loading || otp.join('').length !== 6}
        className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg mb-4"
      >
        {loading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        ) : (
          <>
            <Check className="mr-2 h-5 w-5" />
            Verify Code
          </>
        )}
      </button>

      {/* Resend Section */}
      <div className="text-center space-y-4">
        <p className="text-sm text-gray-600">
          Didn't receive the code?{' '}
          {canResend ? (
            <button
              onClick={handleResend}
              disabled={resendLoading}
              className="font-medium text-primary-600 hover:text-primary-500 inline-flex items-center disabled:opacity-50"
            >
              {resendLoading ? (
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                'Resend'
              )}
            </button>
          ) : (
            <span className="text-gray-500">
              Resend in {resendTimer}s
            </span>
          )}
        </p>

        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center mx-auto"
          >
            <ArrowRight className="h-4 w-4 mr-1 rotate-180" />
            Use a different email
          </button>
        )}
      </div>

      {/* Help Text */}
      <p className="mt-6 text-xs text-gray-500 text-center">
        Code expires in 10 minutes. Check your spam folder if you don't see it.
      </p>
    </div>
  );
};

export default OTPVerification;
