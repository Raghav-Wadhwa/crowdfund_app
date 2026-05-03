/**
 * Campaign Detail Page
 *
 * View single campaign with full details
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import DonateModal from '../components/DonateModal';
import { useAuth } from '../context/AuthContext';
import { Edit, Share2, Check, Clock } from 'lucide-react';

const CampaignDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const setEdit = () => {
    if (user.role === 'admin') {
      setEdit(true);
    }
    setEdit(false);
  };

  useEffect(() => {
    fetchCampaign();
  }, [id]);

  const fetchCampaign = async () => {
    try {
      const response = await api.get(`/campaign.get/${id}`);
      setCampaign(response.data.campaign);
    } catch (error) {
      toast.error('Failed to load campaign');
    } finally {
      setLoading(false);
    }
  };

  const canEdit = () => {
    if (!user || !campaign) return false;
    const isCreator = campaign.creator._id === user.id;
    const isAdmin = user.role === 'admin';
    return isCreator || isAdmin;
  };

  const isDeadlinePassed = () => {
    if (!campaign?.deadline) return false;
    const deadlineDate = new Date(campaign.deadline);
    const now = new Date();
    return now > deadlineDate;
  };

  const formatDeadline = (deadline) => {
    if (!deadline) return 'No deadline set';
    const date = new Date(deadline);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDaysRemaining = () => {
    if (!campaign?.deadline) return null;
    const deadlineDate = new Date(campaign.deadline);
    const now = new Date();
    const diffTime = deadlineDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getCampaignStatus = () => {
    if (campaign?.status === 'completed') return 'completed';
    if (isDeadlinePassed()) return 'expired';
    if (campaign?.status === 'cancelled') return 'cancelled';
    return 'active';
  };

  const handleEdit = () => {
    navigate(`/campaigns/${id}/edit`);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/campaigns/${id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2002);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Campaign not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-700 overflow-hidden transition-colors">
          <div className="h-96 bg-gradient-to-r from-primary-400 to-primary-600 flex items-center justify-center">
            {campaign.image ? (
              <img src={campaign.image} alt={campaign.title} className="w-full h-full object-cover" />
            ) : (
              <div className="text-white text-9xl font-bold">{campaign.title.charAt(0)}</div>
            )}
          </div>

          <div className="p-8">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="inline-block bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-3 py-1 rounded-full font-semibold text-sm">
                {campaign.category}
              </span>
              {getCampaignStatus() === 'completed' && (
                <span className="inline-block bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full font-semibold text-sm">✅ Completed</span>
              )}
              {getCampaignStatus() === 'expired' && (
                <span className="inline-block bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-3 py-1 rounded-full font-semibold text-sm">⏰ Expired</span>
              )}
              {getCampaignStatus() === 'cancelled' && (
                <span className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-full font-semibold text-sm">🚫 Cancelled</span>
              )}
              {getCampaignStatus() === 'active' && getDaysRemaining() !== null && getDaysRemaining() <= 7 && (
                <span className="inline-block bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-3 py-1 rounded-full font-semibold text-sm">⏳ {getDaysRemaining()} days left</span>
              )}
            </div>

            <div className="flex justify-between items-start mb-4">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{campaign.title}</h1>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleShare}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
                    copied
                      ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                      : 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-900/50'
                  }`}
                >
                  {copied ? <><Check className="h-5 w-5" /><span>Copied!</span></> : <><Share2 className="h-5 w-5" /><span>Share</span></>}
                </button>
                {canEdit() && (
                  <button onClick={handleEdit} className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium">
                    <Edit className="h-5 w-5" /><span>Edit</span>
                  </button>
                )}
              </div>
            </div>

            <p className="text-gray-600 dark:text-gray-400 text-base mb-8 whitespace-pre-wrap break-words overflow-hidden" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>{campaign.description}</p>

            <div className="relative group mb-8">
              <button
                onClick={() => getCampaignStatus() === 'active' && setShowModal(true)}
                disabled={getCampaignStatus() !== 'active'}
                className={`w-full py-3 px-6 rounded-lg font-semibold text-lg transition-all ${
                  getCampaignStatus() === 'active'
                    ? 'bg-primary-600 dark:bg-primary-500 text-white hover:bg-primary-700 dark:hover:bg-primary-600 cursor-pointer'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-70'
                }`}
              >
                {getCampaignStatus() === 'active' ? 'Back This Campaign' : getCampaignStatus() === 'completed' ? '🎉 Campaign Closed - Goal Reached' : getCampaignStatus() === 'expired' ? '⏰ Campaign Closed - Expired' : '🚫 Campaign Closed'}
              </button>
              {getCampaignStatus() !== 'active' && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 dark:bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  {getCampaignStatus() === 'completed' ? '🎉 This campaign has reached its goal!' : getCampaignStatus() === 'expired' ? '⏰ This campaign has ended (deadline passed)' : '🚫 This campaign is no longer active'}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-800 dark:border-t-gray-900"></div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-8 transition-colors">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Raised</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{campaign.currentAmount.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Goal</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{campaign.goalAmount.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Backers</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{campaign.donorsCount}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-1 flex items-center gap-1"><Clock className="h-4 w-4" />Deadline</p>
                  <p className={`text-lg font-bold ${isDeadlinePassed() ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{formatDeadline(campaign.deadline)}</p>
                  {getDaysRemaining() !== null && getDaysRemaining() > 0 && <p className="text-sm text-gray-500 dark:text-gray-400">{getDaysRemaining()} days remaining</p>}
                  {isDeadlinePassed() && <p className="text-sm text-red-500 dark:text-red-400">Deadline has passed</p>}
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 mb-2">
                <div className="bg-gradient-to-r from-primary-600 to-primary-400 dark:from-primary-500 dark:to-primary-300 h-3 rounded-full transition-all" style={{ width: `${Math.min((campaign.currentAmount / campaign.goalAmount) * 100, 100)}%` }}></div>
              </div>
              <p className="text-right text-sm text-gray-600 dark:text-gray-400">{Math.round(campaign.progress)}% funded</p>
            </div>

            <div className="border-t dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Campaign Creator</h3>
              <p className="text-gray-600 dark:text-gray-400">{campaign.creator.name}</p>
            </div>
          </div>
        </div>
      </div>

      <DonateModal isOpen={showModal} onClose={() => setShowModal(false)} campaign={campaign} onDonationSuccess={fetchCampaign} />
    </div>
  );
};

export default CampaignDetail;
