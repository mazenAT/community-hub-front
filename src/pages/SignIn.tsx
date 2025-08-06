import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { secureStorage } from "@/services/native";
import { authApi, familyMembersApi } from "@/services/api";

const shakeClass = "animate-shake border-brand-red";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [shake, setShake] = useState<{ email: boolean; password: boolean }>({ email: false, password: false });
  const navigate = useNavigate();

  const signInMutation = useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      authApi.login(data),
    onSuccess: async (response) => {
      localStorage.setItem('token', response.data.token);
      toast.success("Signed in successfully");
      
      // Check if user has family members
      try {
        const familyMembersResponse = await familyMembersApi.getFamilyMembers();
        const familyMembers = familyMembersResponse.data;
        
        if (familyMembers && familyMembers.length > 0) {
          // User has family members, go to wallet
          navigate("/wallet");
        } else {
          // User has no family members, go to family setup
          navigate("/family-setup");
        }
      } catch (error) {
        // If there's an error checking family members, default to family setup
        navigate("/family-setup");
      }
    },
    onError: (error: any) => {
      const apiMsg = error.response?.data?.message || "Failed to sign in";
      toast.error(apiMsg);
      // Example: if API returns field errors, set them here
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
        setShake({
          email: !!error.response.data.errors.email,
          password: !!error.response.data.errors.password,
        });
      } else {
        setErrors({ email: apiMsg, password: apiMsg });
        setShake({ email: true, password: true });
      }
      setTimeout(() => setShake({ email: false, password: false }), 600);
    },
  });

  const handleSignIn = () => {
    let newErrors: { email?: string; password?: string } = {};
    let newShake = { email: false, password: false };
    if (!email) {
      newErrors.email = "Email is required";
      newShake.email = true;
    }
    if (!password) {
      newErrors.password = "Password is required";
      newShake.password = true;
    }
    setErrors(newErrors);
    setShake(newShake);
    if (Object.keys(newErrors).length > 0) {
      setTimeout(() => setShake({ email: false, password: false }), 600);
      return;
    }
    signInMutation.mutate({
      email,
      password,
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300">
      <img src="/Logo.jpg" alt="App Logo" className="w-32 h-32 mb-6" />
      <div className="w-full max-w-sm space-y-8">
        {/* Welcome Text */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold text-brand-black">Welcome back</h1>
          <p className="text-brand-black/70">Sign in to continue</p>
        </div>

        {/* Sign In Form */}
        <div className="space-y-4">
          <div className="space-y-3">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`h-12 bg-white border-2 border-brand-yellow/30 text-base focus:border-brand-red ${shake.email ? shakeClass : ''}`}
            />
            {errors.email && <div className="text-brand-red text-xs mt-1 animate-fade-in">{errors.email}</div>}
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`h-12 bg-white border-2 border-brand-yellow/30 text-base focus:border-brand-red ${shake.password ? shakeClass : ''}`}
            />
            {errors.password && <div className="text-brand-red text-xs mt-1 animate-fade-in">{errors.password}</div>}
          </div>

          <div className="flex justify-end">
            <button 
              onClick={() => navigate("/forgot-password")}
              className="text-brand-red text-sm hover:text-brand-red/80"
            >
              Forgot Password?
            </button>
          </div>

          <Button 
            onClick={handleSignIn}
            disabled={signInMutation.isPending}
            className="w-full h-12 bg-brand-red hover:bg-brand-red/90 text-white font-medium rounded-xl"
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
          <span className="text-brand-black/70">Don't have an account? </span>
          <button 
            onClick={() => navigate("/signup")}
            className="text-brand-red font-medium hover:text-brand-red/80"
          >
            Sign Up
          </button>
        </div>
      </div>
      {/* Shake animation keyframes */}
      <style>{`
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes shake {
          10%, 90% { transform: translateX(-2px); }
          20%, 80% { transform: translateX(4px); }
          30%, 50%, 70% { transform: translateX(-8px); }
          40%, 60% { transform: translateX(8px); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-in;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default SignIn;
