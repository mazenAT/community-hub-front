import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Check, Building2 } from 'lucide-react';
import { useState } from 'react';

interface InstaPayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referenceCode: string;
  bankDetails: any;
  amount: number;
}

const InstaPayModal: React.FC<InstaPayModalProps> = ({
  open,
  onOpenChange,
  referenceCode,
  bankDetails,
  amount
}) => {
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);

  const copyToClipboard = (text: string, type: 'ref' | 'account') => {
    navigator.clipboard.writeText(text);
    if (type === 'ref') {
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    } else {
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-brand-black text-center">
            InstaPay Transfer Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Reference Code */}
          <div className="bg-gradient-to-r from-brand-red to-brand-orange p-4 rounded-xl text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Reference Code</h3>
              <Button
                size="sm"
                variant="outline"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                onClick={() => copyToClipboard(referenceCode, 'ref')}
              >
                {copiedRef ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-2xl font-mono font-bold">{referenceCode}</p>
          </div>
          
          {/* Amount */}
          <div className="bg-gray-50 p-4 rounded-xl">
            <h3 className="text-lg font-semibold text-brand-black mb-2">Transfer Amount</h3>
            <p className="text-2xl font-bold text-brand-red">{amount} EGP</p>
          </div>
          
          {/* Bank Details */}
          <div className="bg-gray-50 p-4 rounded-xl">
            <h3 className="text-lg font-semibold text-brand-black mb-3">Bank Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Bank:</span>
                <span className="font-medium">{bankDetails?.bank_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Account:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono">{bankDetails?.account_number || 'N/A'}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => copyToClipboard(bankDetails?.account_number || '', 'account')}
                  >
                    {copiedAccount ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Beneficiary:</span>
                <span className="font-medium">{bankDetails?.beneficiary_name || 'N/A'}</span>
              </div>
            </div>
          </div>
          
          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-xl">
            <p className="text-yellow-800 text-sm">
              ⚠️ Please include the reference code in your transfer description
            </p>
          </div>
        </div>
        
        <Button
          onClick={() => onOpenChange(false)}
          className="w-full bg-gradient-to-r from-brand-red to-brand-orange hover:from-brand-red/90 hover:to-brand-orange/90 text-white font-semibold py-3 rounded-xl"
        >
          Got It
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default InstaPayModal;