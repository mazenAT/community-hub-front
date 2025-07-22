import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { secureStorage } from "@/services/native";
import { authApi } from "@/services/api";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const signInMutation = useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      authApi.login(data),
    onSuccess: async (response) => {
      localStorage.setItem('token', response.data.token);
      toast.success("Signed in successfully");
      navigate("/wallet");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to sign in");
    },
  });

  const handleSignIn = () => {
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    signInMutation.mutate({
      email,
      password,
    });
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
          <h1 className="text-2xl font-semibold text-gray-900">Welcome back</h1>
          <p className="text-gray-500">Sign in to continue</p>
        </div>

        {/* Sign In Form */}
        <div className="space-y-4">
          <div className="space-y-3">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 bg-gray-100 border-0 text-base"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 bg-gray-100 border-0 text-base"
            />
          </div>

          <div className="flex justify-end">
            <button 
              onClick={() => navigate("/forgot-password")}
              className="text-blue-500 text-sm"
            >
              Forgot Password?
            </button>
          </div>

          <Button 
            onClick={handleSignIn}
            disabled={signInMutation.isPending}
            className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl"
          >
            {signInMutation.isPending ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Signing in...</span>
              </div>
            ) : (
              "Sign In"
            )}
          </Button>
        </div>

        {/* Sign Up Link */}
        <div className="text-center">
          <span className="text-gray-500">Don't have an account? </span>
          <button 
            onClick={() => navigate("/signup")}
            className="text-blue-500 font-medium"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
