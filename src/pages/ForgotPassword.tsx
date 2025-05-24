
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);
  const navigate = useNavigate();

  const handleResetPassword = () => {
    // For demo purposes, show success state
    setIsEmailSent(true);
  };

  const handleBackToSignIn = () => {
    navigate("/");
  };

  if (isEmailSent) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 animate-fade-in">
        <div className="w-full max-w-sm space-y-8">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center animate-bounce-in">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Success Text */}
          <div className="text-center space-y-2 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <h1 className="text-2xl font-semibold text-gray-900">Check your email</h1>
            <p className="text-gray-500">We've sent a password reset link to {email}</p>
          </div>

          <Button 
            onClick={handleBackToSignIn}
            className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl hover:scale-105 transition-all duration-200 animate-scale-in"
            style={{ animationDelay: '0.5s' }}
          >
            Back to Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 animate-fade-in">
      <div className="w-full max-w-sm space-y-8">
        {/* Back Button */}
        <div className="flex items-center animate-slide-in-right">
          <button 
            onClick={() => navigate("/")}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 hover:scale-110 transition-all duration-200"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* App Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center animate-bounce-in">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
        </div>

        {/* Text */}
        <div className="text-center space-y-2 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h1 className="text-2xl font-semibold text-gray-900">Forgot Password?</h1>
          <p className="text-gray-500">Don't worry! Enter your email and we'll send you a reset link</p>
        </div>

        {/* Reset Form */}
        <div className="space-y-4 animate-scale-in" style={{ animationDelay: '0.4s' }}>
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 bg-gray-100 border-0 text-base focus:ring-2 focus:ring-blue-500 transition-all duration-200"
          />

          <Button 
            onClick={handleResetPassword}
            disabled={!email}
            className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl disabled:bg-gray-300 disabled:cursor-not-allowed hover:scale-105 transition-all duration-200"
          >
            Send Reset Link
          </Button>
        </div>

        {/* Back to Sign In */}
        <div className="text-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <span className="text-gray-500">Remember your password? </span>
          <button 
            onClick={() => navigate("/")}
            className="text-blue-500 font-medium hover:text-blue-600 hover:underline transition-all duration-200"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
