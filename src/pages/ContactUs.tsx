import React, { useState } from 'react';
import { contactApi } from '../services/api';
import { toast } from 'sonner';
import { Send, CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import BottomNavigation from '../components/BottomNavigation';
import { useNavigate } from 'react-router-dom';

const ContactUs = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await contactApi.submitContact(form);
      toast.success('Message sent successfully! We will get back to you within 48 hours.');
      setSubmitted(true);
      setForm({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-yellow/10 via-brand-orange/5 to-brand-red/5 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 p-4 rounded-full">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-brand-black mb-4">Message Sent!</h2>
          <p className="text-brand-black/70 mb-6">
            Thank you for contacting us. We have received your message and will get back to you within 48 hours.
          </p>
          <Button
            onClick={() => setSubmitted(false)}
            className="w-full bg-brand-red hover:bg-brand-red/90 text-white"
          >
            Send Another Message
          </Button>
          <Button
            onClick={() => setSubmitted(false)}
            className="w-full bg-gray-200 hover:bg-gray-300 text-brand-black mt-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Form
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 p-4 pb-20">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8" data-tutorial="contact-header">
          <h1 className="text-3xl font-bold text-brand-black mb-2">Contact Us</h1>
          <p className="text-brand-black/70">
            Have a question or need help? We'd love to hear from you.
          </p>
        </div>

        {/* Paymob Payment Help Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6" data-tutorial="paymob-payment-help">
          <h2 className="text-xl font-bold text-brand-black mb-4">Paymob Payment Issues</h2>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">Card Payment Problems</h3>
              <p className="text-sm text-blue-700">
                Having trouble with credit/debit card payments? Check your card details, billing information, and ensure your card supports online transactions.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <h3 className="font-semibold text-green-900 mb-2">Mobile Wallet Issues</h3>
              <p className="text-sm text-green-700">
                Problems with Vodafone Cash, Orange Money, or other mobile wallets? Verify your wallet balance and phone number.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6" data-tutorial="contact-form">
          <h2 className="text-xl font-bold text-brand-black mb-6">Send us a Message</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-black mb-2">
                Full Name *
              </label>
              <Input
                type="text"
                value={form.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your full name"
                className="w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-black mb-2">
                Email Address *
              </label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your email address"
                className="w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-black mb-2">
                Phone Number
              </label>
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter your phone number (optional)"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-black mb-2">
                Message *
              </label>
              <textarea
                value={form.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                placeholder="Tell us how we can help you..."
                rows={5}
                className="w-full px-4 py-3 border-2 border-brand-yellow/30 rounded-xl focus:border-brand-red outline-none transition-colors resize-none"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-red hover:bg-brand-red/90 text-white flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Message</span>
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-brand-yellow/10 rounded-xl border border-brand-yellow/30">
            <p className="text-sm text-brand-black/70">
              <strong>Note:</strong> Email responses are typically sent within 48 hours during business days.
            </p>
          </div>
        </div>
      </div>
      
      <BottomNavigation activeTab="contact" />
    </div>
  );
};

export default ContactUs; 