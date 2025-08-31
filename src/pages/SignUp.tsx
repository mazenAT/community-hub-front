import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authApi, schoolApi } from "@/services/api";

const SignUp = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedSchool, setSelectedSchool] = useState("");
  const [selectedRole] = useState("user"); // Mobile app users are always assigned 'user' role (parents)
  const [schools, setSchools] = useState<{ id: number; name: string }[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [shake, setShake] = useState<{ [key: string]: boolean }>({});

  const signUpMutation = useMutation({
    mutationFn: (data: {
      name: string;
      email: string;
      password: string;
      password_confirmation: string;
      role: string;
      school_id: number;
      phone?: string;
    }) =>
      authApi.register(data),
    onSuccess: () => {
      toast.success("Account created successfully! Please sign in to continue.");
      navigate("/");
    },
    onError: (error: any) => {
      const apiMsg = error.response?.data?.message || "Failed to create account";
      toast.error(apiMsg);
      
      // Handle backend validation errors
      if (error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        setErrors(backendErrors);
        
        // Shake fields that have errors
        const newShake: { [key: string]: boolean } = {};
        Object.keys(backendErrors).forEach(key => {
          newShake[key] = true;
        });
        setShake(newShake);
        
        // Clear shake after animation
        setTimeout(() => setShake({}), 600);
      }
    },
  });

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        setLoadingSchools(true);
        const response = await schoolApi.getSchools();
        setSchools(response.data.data || []);
      } catch (error) {
        toast.error("Failed to fetch schools");
      } finally {
        setLoadingSchools(false);
      }
    };
    fetchSchools();
  }, []);



  const handleSignUp = () => {
    let newErrors: { [key: string]: string } = {};
    let newShake: { [key: string]: boolean } = {};
    if (!name) {
      newErrors.name = "Full name is required.";
      newShake.name = true;
    }
    if (!selectedSchool) {
      newErrors.selectedSchool = "School is required.";
      newShake.selectedSchool = true;
    }
    if (!email) {
      newErrors.email = "Email is required.";
      newShake.email = true;
    }
    if (!password) {
      newErrors.password = "Password is required.";
      newShake.password = true;
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
      newShake.confirmPassword = true;
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
      newShake.confirmPassword = true;
    }
    if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long.";
      newShake.password = true;
    }
    
    // Enhanced password validation matching backend StrongPassword rule
    if (!/[A-Z]/.test(password)) {
      newErrors.password = "Password must contain at least one uppercase letter (A-Z).";
      newShake.password = true;
    }

    if (!/[a-z]/.test(password)) {
      newErrors.password = "Password must contain at least one lowercase letter (a-z).";
      newShake.password = true;
    }

    if (!/[0-9]/.test(password)) {
      newErrors.password = "Password must contain at least one number (0-9).";
      newShake.password = true;
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      newErrors.password = "Password must contain at least one special character (!@#$%^&*).";
      newShake.password = true;
    }

    if (!phone) {
      newErrors.phone = "Phone number is required.";
      newShake.phone = true;
    }
    setErrors(newErrors);
    setShake(newShake);
    if (Object.keys(newErrors).length > 0) {
      setTimeout(() => setShake({}), 600);
      return;
    }
    signUpMutation.mutate({
      name,
      email,
      password,
      password_confirmation: confirmPassword,
      role: selectedRole,
      school_id: Number(selectedSchool), // selectedSchool is validated to be non-empty
      phone,
    });
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
            <img src="/Logo.jpg" alt="App Logo" className="w-32 h-32 rounded-full shadow-2xl shadow-orange-500/30" />
            <div className="absolute inset-0 w-32 h-32 rounded-full bg-gradient-to-r from-orange-500 to-red-500 opacity-20 blur-xl"></div>
          </div>
        </div>
        
        {/* Welcome Text */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-white">Create Parent Account</h1>
          <p className="text-orange-200 text-lg">Sign up as a parent to manage your family's meals</p>
        </div>

        {/* Sign Up Form */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`h-14 bg-white/10 backdrop-blur-sm border-2 border-orange-500/30 text-white placeholder:text-orange-200/70 text-base focus:border-orange-500 focus:bg-white/20 transition-all duration-300 ${shake.name ? 'animate-shake border-red-500' : ''}`}
              />
              {errors.name && <div className="text-red-400 text-sm mt-1 animate-fade-in font-medium">{errors.name}</div>}
            </div>

            <div className="space-y-2">
              <Select value={selectedSchool} onValueChange={setSelectedSchool} disabled={loadingSchools}>
                <SelectTrigger className={`h-14 bg-white/10 backdrop-blur-sm border-2 border-orange-500/30 text-white placeholder:text-orange-200/70 text-base focus:border-orange-500 focus:bg-white/20 transition-all duration-300 ${shake.selectedSchool ? 'animate-shake border-red-500' : ''}`}>
                  <SelectValue placeholder={loadingSchools ? "Loading schools..." : "Select your school"} />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border border-orange-500/30 shadow-lg z-50 text-white">
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={String(school.id)} className="hover:bg-orange-500/20">
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.selectedSchool && <div className="text-red-400 text-sm mt-1 animate-fade-in font-medium">{errors.selectedSchool}</div>}
            </div>


            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`h-14 bg-white/10 backdrop-blur-sm border-2 border-orange-500/30 text-white placeholder:text-orange-200/70 text-base focus:border-orange-500 focus:bg-white/20 transition-all duration-300 ${shake.email ? 'animate-shake border-red-500' : ''}`}
              />
              {errors.email && <div className="text-red-400 text-sm mt-1 animate-fade-in font-medium">{errors.email}</div>}
            </div>
            
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`h-14 bg-white/10 backdrop-blur-sm border-2 border-orange-500/30 text-white placeholder:text-orange-200/70 text-base focus:border-orange-500 focus:bg-white/20 transition-all duration-300 ${shake.password ? 'animate-shake border-red-500' : ''}`}
              />
              {errors.password && <div className="text-red-400 text-sm mt-1 animate-fade-in font-medium">{errors.password}</div>}
              <div className="text-xs text-orange-200/80 mt-1">
                Password must be at least 8 characters with uppercase, lowercase, number, and special character
              </div>
            </div>
            
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`h-14 bg-white/10 backdrop-blur-sm border-2 border-orange-500/30 text-white placeholder:text-orange-200/70 text-base focus:border-orange-500 focus:bg-white/20 transition-all duration-300 ${shake.confirmPassword ? 'animate-shake border-red-500' : ''}`}
              />
              {errors.confirmPassword && <div className="text-red-400 text-sm mt-1 animate-fade-in font-medium">{errors.confirmPassword}</div>}
            </div>
            
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`h-14 bg-white/10 backdrop-blur-sm border-2 border-orange-500/30 text-white placeholder:text-orange-200/70 text-base focus:border-orange-500 focus:bg-white/20 transition-all duration-300 ${shake.phone ? 'animate-shake border-red-500' : ''}`}
              />
              {errors.phone && <div className="text-red-400 text-sm mt-1 animate-fade-in font-medium">{errors.phone}</div>}
            </div>
          </div>

          <Button 
            onClick={handleSignUp}
            disabled={signUpMutation.isPending}
            className="w-full h-14 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold text-lg rounded-2xl shadow-2xl shadow-orange-500/30 transition-all duration-300 transform hover:scale-105"
          >
            {signUpMutation.isPending ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating account...</span>
              </div>
            ) : (
              "Sign Up"
            )}
          </Button>
        </div>

        {/* Sign In Link */}
        <div className="text-center pt-4">
          <span className="text-orange-200/80">Already have an account? </span>
          <button 
            onClick={() => navigate("/")}
            className="text-orange-300 font-bold hover:text-orange-200 transition-colors duration-200 ml-1"
          >
            Sign In
          </button>
        </div>
      </div>
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

export default SignUp;
