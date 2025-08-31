import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authApi } from "@/services/api";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const forgotPasswordMutation = useMutation({
    mutationFn: (email: string) => authApi.forgotPassword({ email }),
    onSuccess: () => {
      toast.success("Password reset instructions sent to your email");
      navigate("/");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to send reset instructions");
    },
  });

  const handleSubmit = () => {
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    forgotPasswordMutation.mutate(email);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-900 flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-600/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-sm space-y-8">
        {/* App Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-500/30">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>

        {/* Welcome Text */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-white">Forgot Password</h1>
          <p className="text-orange-200 text-lg">Enter your email to reset your password</p>
        </div>

        {/* Reset Form */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 bg-white/10 backdrop-blur-sm border-2 border-orange-500/30 text-white placeholder:text-orange-200/70 text-base focus:border-orange-500 focus:bg-white/20 transition-all duration-300"
              />
            </div>
          </div>

          <Button 
            onClick={handleSubmit}
            disabled={forgotPasswordMutation.isPending}
            className="w-full h-14 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold text-lg rounded-2xl shadow-2xl shadow-orange-500/30 transition-all duration-300 transform hover:scale-105"
          >
            {forgotPasswordMutation.isPending ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Sending instructions...</span>
              </div>
            ) : (
              "Send Reset Instructions"
            )}
          </Button>
        </div>

        {/* Back to Sign In */}
        <div className="text-center pt-4">
          <button 
            onClick={() => navigate("/")}
            className="text-orange-300 font-bold hover:text-orange-200 transition-colors duration-200"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
