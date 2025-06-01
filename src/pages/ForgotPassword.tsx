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
    mutationFn: (email: string) => authApi.forgotPassword(email),
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

    forgotPasswordMutation.mutate(email);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8">
        {/* App Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        </div>

        {/* Welcome Text */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold text-gray-900">Forgot Password</h1>
          <p className="text-gray-500">Enter your email to reset your password</p>
        </div>

        {/* Reset Form */}
        <div className="space-y-4">
          <div className="space-y-3">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 bg-gray-100 border-0 text-base"
            />
          </div>

          <Button 
            onClick={handleSubmit}
            disabled={forgotPasswordMutation.isPending}
            className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl"
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
        <div className="text-center">
          <button 
            onClick={() => navigate("/")}
            className="text-blue-500 font-medium"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
