import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Building2, Check, Copy } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

interface InstaPayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referenceCode: string;
  bankDetails: any;
  amount: number;
  userName?: string; // Add userName prop
}

const InstaPayModal: React.FC<InstaPayModalProps> = ({
  open,
  onOpenChange,
  referenceCode,
  bankDetails,
  amount,
  userName
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(`${field} copied to clipboard!`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-tutorial="instapay-modal-overview">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            InstaPay Transfer Details
          </DialogTitle>
          <DialogDescription>
            Complete your bank transfer using the details below
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Name instead of Reference Code */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-orange-800">User Name</label>
                <div className="text-lg font-semibold text-orange-900 mt-1">
                  {userName || 'N/A'}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(userName || '', 'User Name')}
                className="ml-2"
              >
                {copiedField === 'User Name' ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Transfer Amount */}
          <div className="text-center bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{amount} EGP</div>
            <div className="text-sm text-blue-700">Transfer Amount</div>
          </div>

          {/* Bank Details */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Bank Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Bank:</span>
                <span className="text-sm font-medium">{bankDetails?.bank_name || 'CIB'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Account:</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{bankDetails?.account_number || '100054480207'}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(bankDetails?.account_number || '100054480207', 'Account Number')}
                  >
                    {copiedField === 'Account Number' ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Beneficiary:</span>
                <span className="text-sm font-medium">{bankDetails?.beneficiary || 'Lite Bite For Food Services'}</span>
              </div>
            </div>
          </div>

          {/* Important Instruction */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-yellow-800 mb-1">Important</h4>
                <p className="text-sm text-yellow-700">
                  Please include the <strong>user name</strong> in your transfer description when making the payment.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full bg-gradient-to-r from-brand-red to-brand-orange"
          >
            Got It
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InstaPayModal;