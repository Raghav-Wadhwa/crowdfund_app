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
import { Edit } from 'lucide-react';

const CampaignDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  // STEP 2A: Add state to control modal visibility
  const [showModal, setShowModal] = useState(false);


  const setEdit = () => {
    if (user.role === 'admin') {
      setEdit(true);
    }
    setEdit(false);
  }

  useEffect(() => {
    fetchCampaign();
  }, [id]);

  const fetchCampaign = async () => {
    try {
      const response = await api.get(`/campaigns/${id}`);
      setCampaign(response.data.campaign);
    } catch (error) {
      toast.error('Failed to load campaign');
    } finally {
      setLoading(false);
    }
  };

  // Check if current user can edit this campaign
  const canEdit = () => {
    if (!user || !campaign) return false;
    const isCreator = campaign.creator._id === user.id;
    const isAdmin = user.role === 'admin';
    return isCreator || isAdmin;
  };

  const handleEdit = () => {
    // Navigate to edit page or open edit modal
    navigate(`/campaigns/${id}/edit`);
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
          {/* Campaign Image */}
          <div className="h-96 bg-gradient-to-r from-primary-400 to-primary-600 flex items-center justify-center">
            {campaign.image ? (
              <img src={campaign.image} alt={campaign.title} className="w-full h-full object-cover" />
            ) : (
              <div className="text-white text-9xl font-bold">{campaign.title.charAt(0)}</div>
            )}
          </div>

          {/* Campaign Content */}
          <div className="p-8">
            <div className="mb-4">
              <span className="inline-block bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-3 py-1 rounded-full font-semibold text-sm">
                {campaign.category}
              </span>
            </div>

            <div className="flex justify-between items-start mb-4">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{campaign.title}</h1>
              
              {/* Edit button - only visible to creator or admin */}
              {canEdit() && (
                <button
                  onClick={handleEdit}
                  className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  <Edit className="h-5 w-5" />
                  <span>Edit</span>
                </button>
              )}
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-8 whitespace-pre-wrap">{campaign.description}</p>

            {/* STEP 2B: Add "Back This Campaign" button */}
            <button
              onClick={() => setShowModal(true)}
              className="w-full bg-primary-600 dark:bg-primary-500 text-white py-3 px-6 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors font-semibold text-lg mb-8"
            >
              Back This Campaign
            </button>
 
            {/* Progress Section */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-8 transition-colors">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Raised</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${campaign.currentAmount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Goal</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${campaign.goalAmount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Backers</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{campaign.donorsCount}</p>
                </div>
              </div>

              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 mb-2">
                <div
                  className="bg-gradient-to-r from-primary-600 to-primary-400 dark:from-primary-500 dark:to-primary-300 h-3 rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      (campaign.currentAmount / campaign.goalAmount) * 100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
              <p className="text-right text-sm text-gray-600 dark:text-gray-400">{Math.round(campaign.progress)}% funded</p>
            </div>

            {/* Creator Info */}
            <div className="border-t dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Campaign Creator</h3>
              <p className="text-gray-600 dark:text-gray-400">{campaign.creator.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* STEP 2C: Add Modal with props */}
      <DonateModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        campaign={campaign}
        onDonationSuccess={fetchCampaign}
      />
    </div>
  );
};

export default CampaignDetail;

