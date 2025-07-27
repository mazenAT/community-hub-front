import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authApi } from "@/services/api";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    const emailParam = searchParams.get("email");
    
    if (tokenParam && emailParam) {
      setToken(tokenParam);
      setEmail(emailParam);
    } else {
      toast.error("Invalid reset link. Please request a new password reset.");
      navigate("/forgot-password");
    }
  }, [searchParams, navigate]);

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

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long");
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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8">
        {/* App Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
        </div>

        {/* Welcome Text */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold text-gray-900">Reset Password</h1>
          <p className="text-gray-500">Enter your new password</p>
        </div>

        {/* Reset Form */}
        <div className="space-y-4">
          <div className="space-y-3">
            <Input
              type="password"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 bg-gray-100 border-0 text-base"
            />
            <Input
              type="password"
              placeholder="Confirm New Password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              className="h-12 bg-gray-100 border-0 text-base"
            />
          </div>

          <Button 
            onClick={handleSubmit}
            disabled={resetPasswordMutation.isPending}
            className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl"
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
        <div className="text-center">
          <button 
            onClick={() => navigate("/signin")}
            className="text-blue-500 text-sm hover:underline"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword; 