import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { secureStorage } from "@/services/native";
import { authApi } from "@/services/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedSchool, setSelectedSchool] = useState("");
  const navigate = useNavigate();

  const schools = [
    "Cairo University",
    "American University in Cairo",
    "Ain Shams University",
    "Alexandria University",
    "Al-Azhar University",
    "Helwan University",
    "Mansoura University",
    "Assiut University",
    "Tanta University",
    "Zagazig University",
    "Benha University",
    "Suez Canal University"
  ];

  const signInMutation = useMutation({
    mutationFn: (data: { email: string; password: string; school: string }) =>
      authApi.signIn(data),
    onSuccess: async (response) => {
      await secureStorage.set('auth_token', response.token);
      await secureStorage.set('refresh_token', response.refresh_token);
      toast.success("Signed in successfully");
      navigate("/wallet");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to sign in");
    },
  });

  const handleSignIn = () => {
    if (!email || !password || !selectedSchool) {
      toast.error("Please fill in all fields");
      return;
    }

    signInMutation.mutate({
      email,
      password,
      school: selectedSchool,
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
            <Select value={selectedSchool} onValueChange={setSelectedSchool}>
              <SelectTrigger className="h-12 bg-gray-100 border-0 text-base">
                <SelectValue placeholder="Select your school" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                {schools.map((school) => (
                  <SelectItem key={school} value={school} className="hover:bg-gray-100">
                    {school}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
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

        {/* Social Login */}
        <div className="space-y-4">
          <div className="flex items-center justify-center text-gray-400 text-sm">
            or continue with
          </div>

          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full h-12 border-gray-200 rounded-xl flex items-center justify-center space-x-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="text-gray-700">Google</span>
            </Button>

            <Button
              variant="outline"
              className="w-full h-12 border-gray-200 rounded-xl flex items-center justify-center space-x-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001.017 0z"/>
              </svg>
              <span className="text-gray-700">Apple</span>
            </Button>
          </div>
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
