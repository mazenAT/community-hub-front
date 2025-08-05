import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, CreditCard, Star } from 'lucide-react';
import { toast } from 'sonner';

interface SavedCard {
  id: number;
  card_token: string; // <-- added
  card_alias: string;
  last_four_digits: string;
  first_six_digits: string;
  brand: string;
  expiry_year: string;
  expiry_month: string;
  is_default: boolean;
  is_active: boolean;
}

interface SavedCardsProps {
  onCardSelect: (card: SavedCard) => void;
  selectedCardId?: number;
}

const SavedCards: React.FC<SavedCardsProps> = ({ onCardSelect, selectedCardId }) => {
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSavedCards();
  }, []);

  const fetchSavedCards = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://community-hub-backend-production.up.railway.app/api'}/card-tokens`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCards(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching saved cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const setDefaultCard = async (cardId: number) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://community-hub-backend-production.up.railway.app/api'}/card-tokens/${cardId}/default`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast.success('Default card updated successfully');
        fetchSavedCards(); // Refresh the list
      }
    } catch (error) {
      toast.error('Failed to update default card');
    }
  };

  const deleteCard = async (cardId: number) => {
    if (!confirm('Are you sure you want to remove this card?')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://community-hub-backend-production.up.railway.app/api'}/card-tokens/${cardId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast.success('Card removed successfully');
        fetchSavedCards(); // Refresh the list
      }
    } catch (error) {
      toast.error('Failed to remove card');
    }
  };

  const getBrandIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return '💳';
      case 'mastercard':
        return '💳';
      case 'meeza':
        return '💳';
      default:
        return '💳';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Saved Cards</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading saved cards...</div>
        </CardContent>
      </Card>
    );
  }

  if (cards.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Saved Cards</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">
            No saved cards yet. Add a card to get started.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saved Cards</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {cards.map((card) => (
          <div
            key={card.id}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              selectedCardId === card.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onCardSelect(card)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{getBrandIcon(card.brand)}</div>
                <div>
                  <div className="font-medium">{card.card_alias}</div>
                  <div className="text-sm text-gray-600">
                    •••• •••• •••• {card.last_four_digits}
                  </div>
                  <div className="text-xs text-gray-500">
                    Expires {card.expiry_month}/{card.expiry_year}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {card.is_default && (
                  <Badge variant="secondary" className="text-xs">
                    <Star className="w-3 h-3 mr-1" />
                    Default
                  </Badge>
                )}
                
                <div className="flex space-x-1">
                  {!card.is_default && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDefaultCard(card.id);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Star className="w-4 h-4" />
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteCard(card.id);
                    }}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default SavedCards; 