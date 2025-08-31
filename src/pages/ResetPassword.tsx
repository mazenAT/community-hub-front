import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authApi } from "@/services/api";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    // First check if we have data from deep linking (mobile app)
    if (location.state?.token && location.state?.email) {
      setToken(location.state.token);
      setEmail(location.state.email);
      return;
    }

    // Fallback to URL parameters (web or email link)
    const tokenParam = searchParams.get("token");
    const emailParam = searchParams.get("email");
    
    if (tokenParam && emailParam) {
      setToken(tokenParam);
      setEmail(emailParam);
    } else {
      toast.error("Invalid reset link. Please request a new password reset.");
      navigate("/forgot-password");
    }
  }, [searchParams, navigate, location.state]);

  const resetPasswordMutation = useMutation({
    mutationFn: (data: {
      email: string;
      password: string;
      password_confirmation: string;
      token: string;
    }) => authApi.resetPassword(data),
    onSuccess: () => {
      toast.success("Password reset successfully! You can now sign in with your new password.");
      navigate("/signin");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to reset password");
    },
  });

  const handleSubmit = () => {
    if (!password || !passwordConfirmation) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password !== passwordConfirmation) {
      toast.error("Passwords do not match");
      return;
    }

    // Enhanced password validation matching backend StrongPassword rule
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    if (!/[A-Z]/.test(password)) {
      toast.error("Password must contain at least one uppercase letter (A-Z)");
      return;
    }

    if (!/[a-z]/.test(password)) {
      toast.error("Password must contain at least one lowercase letter (a-z)");
      return;
    }

    if (!/[0-9]/.test(password)) {
      toast.error("Password must contain at least one number (0-9)");
      return;
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      toast.error("Password must contain at least one special character (!@#$%^&*)");
      return;
    }

    resetPasswordMutation.mutate({
      email,
      password,
      password_confirmation: passwordConfirmation,
      token,
    });
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 0 1121 9z" />
            </svg>
          </div>
        </div>

        {/* Welcome Text */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-white">Reset Password</h1>
          <p className="text-orange-200 text-lg">Enter your new password</p>
          {email && (
            <p className="text-sm text-orange-300/80">Resetting password for: {email}</p>
          )}
        </div>

        {/* Reset Form */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-14 bg-white/10 backdrop-blur-sm border-2 border-orange-500/30 text-white placeholder:text-orange-200/70 text-base focus:border-orange-500 focus:bg-white/20 transition-all duration-300"
              />
            </div>
            
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Confirm New Password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                className="h-14 bg-white/10 backdrop-blur-sm border-2 border-orange-500/30 text-white placeholder:text-orange-200/70 text-base focus:border-orange-500 focus:bg-white/20 transition-all duration-300"
              />
            </div>
          </div>

          <Button 
            onClick={handleSubmit}
            disabled={resetPasswordMutation.isPending}
            className="w-full h-14 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold text-lg rounded-2xl shadow-2xl shadow-orange-500/30 transition-all duration-300 transform hover:scale-105"
          >
            {resetPasswordMutation.isPending ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Resetting password...</span>
              </div>
            ) : (
              "Reset Password"
            )}
          </Button>
        </div>

        {/* Back to Sign In */}
        <div className="text-center pt-4">
          <button 
            onClick={() => navigate("/signin")}
            className="text-orange-300 font-bold hover:text-orange-200 transition-colors duration-200"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword; 