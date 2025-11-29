import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mobileRechargeApi, SavedCard } from '@/services/mobileRecharge';
import { Plus, Star, Trash2 } from 'lucide-react';
import React, { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import CVVInput from './CVVInput';

interface SavedCardPaymentProps {
  amount: number;
  onPaymentSuccess: (transactionId: string) => void;
  onPaymentError: (error: string) => void;
  onAddNewCard: () => void;
}

const SavedCardPayment: React.FC<SavedCardPaymentProps> = ({
  amount,
  onPaymentSuccess,
  onPaymentError,
  onAddNewCard
}) => {
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<SavedCard | null>(null);
  const [showCVVInput, setShowCVVInput] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const isProcessingRef = useRef(false); // Prevent duplicate requests

  useEffect(() => {
    fetchSavedCards();
  }, []);

  const fetchSavedCards = async () => {
    try {
      const savedCards = await mobileRechargeApi.getSavedCards();
      setCards(savedCards);
      
      // Auto-select default card if available
      const defaultCard = savedCards.find(card => card.is_default);
      if (defaultCard) {
        setSelectedCard(defaultCard);
      }
    } catch (error) {
      console.error('Failed to fetch saved cards:', error);
      toast.error('Failed to load saved cards');
    } finally {
      setLoading(false);
    }
  };

  const handleCardSelect = (card: SavedCard) => {
    setSelectedCard(card);
    setShowCVVInput(true);
  };

  const handleCVVSubmit = async (cvv: string) => {
    if (!selectedCard) return;

    // Prevent duplicate requests
    if (isProcessingRef.current || processing) {
      return;
    }

    try {
      isProcessingRef.current = true;
      setProcessing(true);
      
      const response = await mobileRechargeApi.recharge({
        amount,
        payment_method: 'card',
        payment_details: {
          card_token: selectedCard.card_token,
          cvv: cvv,
          save_card: false // Card is already saved
        }
      });

      if (response.status === 'completed') {
        toast.success('Payment completed successfully!');
        onPaymentSuccess(response.transaction_id || '');
      } else {
        throw new Error('Payment failed');
      }
    } catch (error: any) {
      console.error('Saved card payment error:', error);
      const errorMessage = error.response?.data?.message || 'Payment failed. Please try again.';
      onPaymentError(errorMessage);
      toast.error(errorMessage);
      isProcessingRef.current = false;
    } finally {
      setProcessing(false);
      setShowCVVInput(false);
      isProcessingRef.current = false;
    }
  };

  const handleCVVCancel = () => {
    setShowCVVInput(false);
    setSelectedCard(null);
  };

  const deleteCard = async (cardId: number) => {
    if (!confirm('Are you sure you want to remove this card?')) return;

    try {
      await mobileRechargeApi.deleteCard(cardId);
      toast.success('Card removed successfully');
      fetchSavedCards();
    } catch (error) {
      toast.error('Failed to remove card');
    }
  };

  const setDefaultCard = async (cardId: number) => {
    try {
      await mobileRechargeApi.setDefaultCard(cardId);
      toast.success('Default card updated');
      fetchSavedCards();
    } catch (error) {
      toast.error('Failed to update default card');
    }
  };

  if (showCVVInput && selectedCard) {
    return (
      <CVVInput
        selectedCard={selectedCard}
        onCVVSubmit={handleCVVSubmit}
        onCancel={handleCVVCancel}
        isLoading={processing}
      />
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-4">Loading saved cards...</div>
        </CardContent>
      </Card>
    );
  }

  if (cards.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Saved Cards</CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center space-y-4">
          <div className="text-gray-500">
            You don't have any saved cards yet.
          </div>
          <Button
            onClick={onAddNewCard}
            className="w-full bg-gradient-to-r from-brand-red to-brand-orange"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Card
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Select Payment Method</span>
          <Button
            variant="outline"
            size="sm"
            onClick={onAddNewCard}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Card
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {cards.map((card) => (
          <div
            key={card.id}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              selectedCard?.id === card.id
                ? 'border-brand-red bg-brand-red/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleCardSelect(card)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">💳</div>
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
        
        <div className="pt-4 border-t">
          <div className="text-center text-sm text-gray-600">
            Amount: <span className="font-semibold">{amount} EGP</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SavedCardPayment;