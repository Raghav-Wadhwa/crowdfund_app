import React, { useState } from 'react';
import { useAuth } from "../context/AuthContext";
import { User, Mail, Edit3, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import ImageUpload from '../components/ImageUpload';

const Profile = () => {
    const { user, updateUser } = useAuth();
    const [editingField, setEditingField] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [emailChangeStep, setEmailChangeStep] = useState('input'); // 'input', 'otp', 'verified'
    const [otpValue, setOtpValue] = useState('');
    const [pendingEmail, setPendingEmail] = useState('');

    const handleEdit = (field) => {
        setEditingField(field);
        setEditValue(user[field]);
        if (field === 'email') {
            setEmailChangeStep('input');
            setOtpValue('');
            setPendingEmail('');
        }
    }

    const handleCancel = () => {
        setEditingField(null);
        setEditValue('');
        setEmailChangeStep('input');
        setOtpValue('');
        setPendingEmail('');
    }

    const handleSave = async () => {
        // Special handling for email changes - requires OTP verification
        if (editingField === 'email') {
            if (editValue === user.email) {
                toast.error('New email must be different from current email');
                return;
            }
            
            try {
                // Request OTP to be sent to new email
                const response = await api.post('/auth/request-email-change', {
                    newEmail: editValue,
                });
                
                if (response.data.success) {
                    toast.success('Verification code sent to your new email!');
                    setEmailChangeStep('otp');
                    setPendingEmail(editValue);
                }
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to send verification code');
            }
            return;
        }
        
        // Regular field update (name, avatar)
        try{
            const response = await api.put('/auth/update-profile', {
                [editingField]: editValue,
            })
            if(response.data.success){
                toast.success('Profile updated successfully');
                setEditingField(null);
                // Update the user in AuthContext so changes reflect immediately
                updateUser({ [editingField]: editValue });
            }
            else{
                toast.error(response.data.message);
            }
        }
        catch(error){
            console.error('Error saving profile:', error);
            toast.error('Failed to save changes');
        }
    }

    const handleVerifyEmailChange = async () => {
        try {
            const response = await api.post('/auth/verify-email-change', {
                newEmail: pendingEmail,
                otp: otpValue,
            });
            
            if (response.data.success) {
                toast.success('Email address updated successfully!');
                setEditingField(null);
                setEmailChangeStep('input');
                setOtpValue('');
                setPendingEmail('');
                // Update the user in AuthContext
                updateUser({ email: pendingEmail });
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to verify email change');
        }
    }

    const handleResendEmailChangeOTP = async () => {
        try {
            const response = await api.post('/auth/request-email-change', {
                newEmail: pendingEmail,
            });
            
            if (response.data.success) {
                toast.success('New verification code sent!');
                setOtpValue('');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to resend code');
        }
    }

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 transition-colors'>
            {/* Page Title */}
            <div className='max-w-2xl mx-auto mb-8'>
                <h1 className='text-3xl md:text-4xl font-bold text-gray-900 dark:text-white text-center'>
                    My Profile
                </h1>
                <p className='text-gray-600 dark:text-gray-400 text-center mt-2'>
                    Manage your account details
                </p>
            </div>

            {/* Profile Card */}
            <div className='max-w-2xl mx-auto'>
                <div className='bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg dark:shadow-gray-900/50 p-8 transition-colors'>
                    
                    {/* Avatar Section */}
                    <div className='flex flex-col items-center mb-8'>
                        <div className='relative'>
                            {user?.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt="Profile"
                                    className='w-24 h-24 rounded-full object-cover border-4 border-primary-100 dark:border-primary-900'
                                />
                            ) : (
                                <div className='w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-3xl font-bold'>
                                    {user?.name?.charAt(0)?.toUpperCase() || <User className='w-10 h-10' />}
                                </div>
                            )}
                            {/* Edit Avatar Button */}
                            <button
                                onClick={() => setEditingField(editingField === 'avatar' ? null : 'avatar')}
                                className='absolute bottom-0 right-0 bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-full shadow-md transition-colors'
                            >
                                <Camera className='w-4 h-4' />
                            </button>
                        </div>

                        {/* Avatar Upload - shown when editing avatar */}
                        {editingField === 'avatar' && (
                            <div className='mt-4 w-full max-w-xs'>
                                <ImageUpload
                                    endpoint='/upload/avatar'
                                    currentImage={user?.avatar}
                                    onUploadSuccess={(url) => {
                                        updateUser({ avatar: url });
                                        setEditingField(null);
                                        toast.success('Avatar updated!');
                                    }}
                                    onUploadError={() => {
                                        toast.error('Failed to upload avatar');
                                    }}
                                    label="Upload New Avatar"
                                    maxSizeMB={2}
                                />
                                <button
                                    onClick={() => setEditingField(null)}
                                    className='mt-2 w-full text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>

                    {/* User Info */}
                    <div className='space-y-6'>
                        {/* Name Field */}
                        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg gap-3'>
                            <div className='flex items-center space-x-3 flex-1 min-w-0'>
                                <div className='p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex-shrink-0'>
                                    <User className='w-5 h-5 text-primary-600 dark:text-primary-400' />
                                </div>
                                <div className='flex-1 min-w-0'>
                                    <p className='text-sm text-gray-500 dark:text-gray-400'>Full Name</p>
                                    
                                    {/* Toggle between input and text */}
                                    {editingField === 'name' ? (
                                        <input 
                                            type="text"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className='font-semibold text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 w-full sm:w-48 focus:outline-none focus:ring-2 focus:ring-primary-500'
                                            autoFocus
                                        />
                                    ) : (
                                        <p className='font-semibold text-gray-900 dark:text-white truncate'>{user?.name || 'Not set'}</p>
                                    )}
                                </div>
                            </div>
                            
                            {/* Toggle between Save/Cancel and Edit buttons */}
                            {editingField === 'name' ? (
                                <div className='flex items-center space-x-2 sm:flex-shrink-0'>
                                    <button 
                                        onClick={handleSave}
                                        className='flex-1 sm:flex-none text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 text-sm font-medium px-3 py-2 rounded hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors'
                                    >
                                        Save
                                    </button>
                                    <button 
                                        onClick={handleCancel}
                                        className='flex-1 sm:flex-none text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 text-sm px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => handleEdit('name')}
                                    className='sm:flex-shrink-0 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium px-3 py-2 rounded hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors self-start sm:self-auto'
                                >
                                    Edit
                                </button>
                            )}
                        </div>

                        {/* Email Field */}
                        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg gap-3'>
                            <div className='flex items-center space-x-3 flex-1 min-w-0'>
                                <div className='p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex-shrink-0'>
                                    <Mail className='w-5 h-5 text-primary-600 dark:text-primary-400' />
                                </div>
                                <div className='flex-1 min-w-0'>
                                    <p className='text-sm text-gray-500 dark:text-gray-400'>Email Address</p>
                                    
                                    {/* Show different UI based on email change step */}
                                    {editingField === 'email' && emailChangeStep === 'input' ? (
                                        <input 
                                            type="email"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            placeholder="Enter new email..."
                                            className='font-semibold text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 w-full sm:w-48 focus:outline-none focus:ring-2 focus:ring-primary-500'
                                            autoFocus
                                        />
                                    ) : editingField === 'email' && emailChangeStep === 'otp' ? (
                                        <div className='space-y-1'>
                                            <p className='text-xs text-green-600 dark:text-green-400'>
                                                Code sent to {pendingEmail}
                                            </p>
                                            <input 
                                                type="text"
                                                value={otpValue}
                                                onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                placeholder="Enter 6-digit code"
                                                maxLength="6"
                                                className='font-semibold text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 w-full sm:w-48 focus:outline-none focus:ring-2 focus:ring-primary-500'
                                                autoFocus
                                            />
                                            <button
                                                onClick={handleResendEmailChangeOTP}
                                                className='text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 underline'
                                            >
                                                Resend code
                                            </button>
                                        </div>
                                    ) : (
                                        <p className='font-semibold text-gray-900 dark:text-white truncate'>{user?.email || 'Not set'}</p>
                                    )}
                                </div>
                            </div>
                            
                            {/* Toggle between Save/Verify/Cancel and Edit buttons */}
                            {editingField === 'email' && emailChangeStep === 'input' ? (
                                <div className='flex items-center space-x-2 sm:flex-shrink-0'>
                                    <button 
                                        onClick={handleSave}
                                        className='flex-1 sm:flex-none text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 text-sm font-medium px-3 py-2 rounded hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors'
                                    >
                                        Send Code
                                    </button>
                                    <button 
                                        onClick={handleCancel}
                                        className='flex-1 sm:flex-none text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 text-sm px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : editingField === 'email' && emailChangeStep === 'otp' ? (
                                <div className='flex items-center space-x-2 sm:flex-shrink-0'>
                                    <button 
                                        onClick={handleVerifyEmailChange}
                                        disabled={otpValue.length !== 6}
                                        className='flex-1 sm:flex-none text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 text-sm font-medium px-3 py-2 rounded hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50'
                                    >
                                        Verify
                                    </button>
                                    <button 
                                        onClick={handleCancel}
                                        className='flex-1 sm:flex-none text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 text-sm px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => handleEdit('email')}
                                    className='sm:flex-shrink-0 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium px-3 py-2 rounded hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors self-start sm:self-auto'
                                >
                                    Edit
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Password Change Section */}
                    <div className='mt-8 pt-6 border-t border-gray-200 dark:border-gray-700'>
                        <button className='w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 px-4 rounded-lg transition-colors'>
                            Change Password
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;