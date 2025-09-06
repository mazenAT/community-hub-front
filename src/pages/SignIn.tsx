import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useTutorial } from "@/contexts/TutorialContext";

const shakeClass = "animate-shake border-brand-red";

// SignIn component for mobile app users only (students and parents)
// Admin users must use the admin dashboard
const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [shake, setShake] = useState<{ email: boolean; password: boolean }>({ email: false, password: false });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { checkTutorialStatus } = useTutorial();

  const handleSignIn = async () => {
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

    try {
      setIsLoading(true);
      await login(email, password);
      toast.success("Signed in successfully");
      
      // Check tutorial status after successful authentication
      setTimeout(() => {
        checkTutorialStatus();
      }, 1000);
      
    } catch (error: any) {
      const apiMsg = error.response?.data?.message || "Failed to sign in";
      toast.error(apiMsg);
      
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-900 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-600/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-sm space-y-8 p-8">
        {/* Logo with glow effect */}
        <div className="flex justify-center">
          <div className="relative">
            <img src="/Logo.png" alt="App Logo" className="w-32 h-32 rounded-full shadow-2xl shadow-orange-500/30" />
            <div className="absolute inset-0 w-32 h-32 rounded-full bg-gradient-to-r from-orange-500 to-red-500 opacity-20 blur-xl"></div>
          </div>
        </div>
        
        {/* Welcome Text */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-white">Welcome back</h1>
          <p className="text-orange-200 text-lg">Sign in to continue</p>
        </div>

        {/* Sign In Form */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`h-14 bg-white/10 backdrop-blur-sm border-2 border-orange-500/30 text-white placeholder:text-orange-200/70 text-base focus:border-orange-500 focus:bg-white/20 transition-all duration-300 ${shake.email ? shakeClass : ''}`}
              />
              {errors.email && <div className="text-red-400 text-sm mt-1 animate-fade-in font-medium">{errors.email}</div>}
            </div>
            
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`h-14 bg-white/10 backdrop-blur-sm border-2 border-orange-500/30 text-white placeholder:text-orange-200/70 text-base focus:border-orange-500 focus:bg-white/20 transition-all duration-300 ${shake.password ? shakeClass : ''}`}
              />
              {errors.password && <div className="text-red-400 text-sm mt-1 animate-fade-in font-medium">{errors.password}</div>}
            </div>
          </div>

          <div className="flex justify-end">
            <button 
              onClick={() => navigate("/forgot-password")}
              className="text-orange-300 text-sm hover:text-orange-200 transition-colors duration-200 font-medium"
            >
              Forgot Password?
            </button>
          </div>

          <Button 
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full h-14 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold text-lg rounded-2xl shadow-2xl shadow-orange-500/30 transition-all duration-300 transform hover:scale-105"
          >
            {isLoading ? (
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
        <div className="text-center pt-4">
          <span className="text-orange-200/80">Don't have an account? </span>
          <button 
            onClick={() => navigate("/signup")}
            className="text-orange-300 font-bold hover:text-orange-200 transition-colors duration-200 ml-1"
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
