import React, { useState, useEffect } from 'react';
import { contactApi } from '../services/api';
import { toast } from 'sonner';
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import BottomNavigation from '../components/BottomNavigation';

const ContactUs = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [contactInfo, setContactInfo] = useState({
    email: 'support@smartcommunity.com',
    phone: '+20 123 456 7890',
    address: '123 Smart Street, Cairo, Egypt',
    business_hours: 'Mon-Fri 9AM-6PM',
    response_time: 'We\'ll respond within 24 hours',
  });
  const [contactLoading, setContactLoading] = useState(true);

  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://community-hub-backend-production.up.railway.app/api'}/contact-information`);
        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            setContactInfo(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch contact information:', error);
      } finally {
        setContactLoading(false);
      }
    };

    fetchContactInfo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await contactApi.submitContact(form);
      toast.success('Message sent successfully! We will get back to you soon.');
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
      <div className="min-h-screen bg-brand-yellow/5 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 p-4 rounded-full">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-brand-black mb-4">Message Sent!</h2>
          <p className="text-brand-black/70 mb-6">
            Thank you for contacting us. We have received your message and will get back to you as soon as possible.
          </p>
          <Button
            onClick={() => setSubmitted(false)}
            className="w-full bg-brand-red hover:bg-brand-red/90 text-white"
          >
            Send Another Message
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-yellow/5 p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-black mb-2">Contact Us</h1>
          <p className="text-brand-black/70">
            Have a question or need help? We'd love to hear from you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Information */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-brand-black mb-6">Get in Touch</h2>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-brand-yellow/20 p-3 rounded-lg">
                  <Mail className="w-6 h-6 text-brand-red" />
                </div>
                <div>
                  <h3 className="font-semibold text-brand-black">Email</h3>
                  <p className="text-brand-black/70">{contactInfo.email}</p>
                  <p className="text-sm text-brand-black/50">{contactInfo.response_time}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-brand-yellow/20 p-3 rounded-lg">
                  <Phone className="w-6 h-6 text-brand-red" />
                </div>
                <div>
                  <h3 className="font-semibold text-brand-black">Phone</h3>
                  <p className="text-brand-black/70">{contactInfo.phone}</p>
                  <p className="text-sm text-brand-black/50">{contactInfo.business_hours}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-brand-yellow/20 p-3 rounded-lg">
                  <MapPin className="w-6 h-6 text-brand-red" />
                </div>
                <div>
                  <h3 className="font-semibold text-brand-black">Address</h3>
                  <p className="text-brand-black/70">{contactInfo.address}</p>
                  <p className="text-sm text-brand-black/50">Visit us anytime</p>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="mt-8 pt-6 border-t border-brand-yellow/30">
              <h3 className="font-semibold text-brand-black mb-4">Frequently Asked Questions</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-brand-black">How do I order meals?</h4>
                  <p className="text-sm text-brand-black/70">Go to the Planner page and select your desired meals for the week.</p>
                </div>
                <div>
                  <h4 className="font-medium text-brand-black">How do I add family members?</h4>
                  <p className="text-sm text-brand-black/70">Visit your Profile page and use the "Add Child" button to add family members.</p>
                </div>
                <div>
                  <h4 className="font-medium text-brand-black">How do I recharge my wallet?</h4>
                  <p className="text-sm text-brand-black/70">Go to the Wallet page and use the "Recharge" button to add funds.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
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
                <strong>Note:</strong> For urgent matters, please call us directly. 
                Email responses are typically sent within 24 hours during business days.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <BottomNavigation activeTab="contact" />
    </div>
  );
};

export default ContactUs; 