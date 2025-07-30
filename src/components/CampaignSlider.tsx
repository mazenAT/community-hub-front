import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { campaignApi } from '../services/api';

interface Campaign {
  id: number;
  title: string;
  description: string;
  image_url?: string;
  link_url?: string;
  type: 'promotion' | 'announcement' | 'offer' | 'update';
  status: 'active' | 'inactive' | 'draft';
  target_audience: 'all' | 'students' | 'parents' | 'specific_school';
  school_id?: number;
  start_date?: string;
  end_date?: string;
  display_order: number;
  is_featured: boolean;
  school?: {
    id: number;
    name: string;
  };
}

const CampaignSlider: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        const response = await campaignApi.getFeatured();
        setCampaigns(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch campaigns:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (campaigns.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => 
          prevIndex === campaigns.length - 1 ? 0 : prevIndex + 1
        );
      }, 5000); // Auto-advance every 5 seconds

      return () => clearInterval(interval);
    }
  }, [campaigns.length]);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === campaigns.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? campaigns.length - 1 : prevIndex - 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'promotion':
        return 'bg-blue-500';
      case 'announcement':
        return 'bg-purple-500';
      case 'offer':
        return 'bg-orange-500';
      case 'update':
        return 'bg-indigo-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'promotion':
        return 'Promotion';
      case 'announcement':
        return 'Announcement';
      case 'offer':
        return 'Special Offer';
      case 'update':
        return 'Update';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="w-full h-48 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
        <div className="text-gray-400">Loading campaigns...</div>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return null; // Don't render anything if no campaigns
  }

  return (
    <div className="relative w-full h-48 bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Campaign Slides */}
      <div className="relative w-full h-full">
        {campaigns.map((campaign, index) => (
          <div
            key={campaign.id}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="relative w-full h-full">
              {/* Background Image */}
              {campaign.image_url && (
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${campaign.image_url})` }}
                >
                  <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                </div>
              )}
              
              {/* Content */}
              <div className="relative z-10 h-full flex items-center p-6">
                <div className="max-w-md">
                  {/* Type Badge */}
                  <div className="flex items-center space-x-2 mb-3">
                    <span className={`px-2 py-1 rounded-full text-xs text-white ${getTypeColor(campaign.type)}`}>
                      {getTypeText(campaign.type)}
                    </span>
                    {campaign.is_featured && (
                      <span className="px-2 py-1 rounded-full text-xs bg-yellow-500 text-white">
                        Featured
                      </span>
                    )}
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
                    {campaign.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-sm text-white/90 line-clamp-2 mb-4">
                    {campaign.description}
                  </p>
                  
                  {/* Action Button */}
                  {campaign.link_url && (
                    <a
                      href={campaign.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                    >
                      <span>Learn More</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {campaigns.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors backdrop-blur-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors backdrop-blur-sm"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {campaigns.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {campaigns.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex 
                  ? 'bg-white' 
                  : 'bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CampaignSlider; 