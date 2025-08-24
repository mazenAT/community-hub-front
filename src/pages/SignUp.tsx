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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300">
      <img src="/Logo.jpg" alt="App Logo" className="w-32 h-32 mb-6" />
      <div className="w-full max-w-sm space-y-8">
        {/* Welcome Text */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold text-brand-black">Create Parent Account</h1>
          <p className="text-brand-black/70">Sign up as a parent to manage your family's meals</p>
        </div>

        {/* Sign Up Form */}
        <div className="space-y-4">
          <div className="space-y-3">
            <Input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`h-12 bg-white border-2 border-brand-yellow/30 text-base focus:border-brand-red ${shake.name ? 'animate-shake border-brand-red' : ''}`}
            />
            {errors.name && <div className="text-brand-red text-xs mt-1 animate-fade-in">{errors.name}</div>}

            <Select value={selectedSchool} onValueChange={setSelectedSchool} disabled={loadingSchools}>
              <SelectTrigger className={`h-12 bg-white border-2 border-brand-yellow/30 text-base focus:border-brand-red ${shake.selectedSchool ? 'animate-shake border-brand-red' : ''}`}>
                <SelectValue placeholder={loadingSchools ? "Loading schools..." : "Select your school"} />
              </SelectTrigger>
              <SelectContent className="bg-white border border-brand-yellow/30 shadow-lg z-50">
                {schools.map((school) => (
                  <SelectItem key={school.id} value={String(school.id)}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.selectedSchool && <div className="text-brand-red text-xs mt-1 animate-fade-in">{errors.selectedSchool}</div>}


            
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`h-12 bg-white border-2 border-brand-yellow/30 text-base focus:border-brand-red ${shake.email ? 'animate-shake border-brand-red' : ''}`}
            />
            {errors.email && <div className="text-brand-red text-xs mt-1 animate-fade-in">{errors.email}</div>}
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`h-12 bg-white border-2 border-brand-yellow/30 text-base focus:border-brand-red ${shake.password ? 'animate-shake border-brand-red' : ''}`}
            />
            {errors.password && <div className="text-brand-red text-xs mt-1 animate-fade-in">{errors.password}</div>}
            <div className="text-xs text-brand-black/60 mt-1">
              Password must be at least 8 characters with uppercase, lowercase, number, and special character
            </div>
            <Input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`h-12 bg-white border-2 border-brand-yellow/30 text-base focus:border-brand-red ${shake.confirmPassword ? 'animate-shake border-brand-red' : ''}`}
            />
            {errors.confirmPassword && <div className="text-brand-red text-xs mt-1 animate-fade-in">{errors.confirmPassword}</div>}
            <Input
              type="text"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`h-12 bg-white border-2 border-brand-yellow/30 text-base focus:border-brand-red ${shake.phone ? 'animate-shake border-brand-red' : ''}`}
            />
            {errors.phone && <div className="text-brand-red text-xs mt-1 animate-fade-in">{errors.phone}</div>}
          </div>

          <Button 
            onClick={handleSignUp}
            disabled={signUpMutation.isPending}
            className="w-full h-12 bg-brand-red hover:bg-brand-red/90 text-white font-medium rounded-xl"
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
        <div className="text-center">
          <span className="text-brand-black/70">Already have an account? </span>
          <button 
            onClick={() => navigate("/")}
            className="text-brand-red font-medium hover:text-brand-red/80"
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
