import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [schools, setSchools] = useState<{ id: number; name: string }[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [phone, setPhone] = useState("");

  const allergies = [
    "Nuts",
    "Dairy",
    "Gluten",
    "Eggs",
    "Shellfish",
    "Fish",
    "Soy",
    "Sesame",
    "Peanuts",
    "Tree Nuts",
    "None"
  ];

  const signUpMutation = useMutation({
    mutationFn: (data: {
      name: string;
      email: string;
      password: string;
      password_confirmation: string;
      role: string;
      school_id: number;
      phone?: string;
      allergies: string[];
    }) =>
      authApi.register(data),
    onSuccess: () => {
      toast.success("Account created successfully");
      navigate("/");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create account");
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

  const handleAllergyChange = (allergy: string, checked: boolean) => {
    if (checked) {
      if (allergy === "None") {
        setSelectedAllergies(["None"]);
      } else {
        setSelectedAllergies(prev => prev.filter(a => a !== "None").concat(allergy));
      }
    } else {
      setSelectedAllergies(prev => prev.filter(a => a !== allergy));
    }
  };

  const handleSignUp = () => {
    if (!name) {
      toast.error("Please fill in your full name.");
      return;
    }
    if (!selectedSchool) {
      toast.error("Please select your school.");
      return;
    }
    if (!email) {
      toast.error("Please fill in your email.");
      return;
    }
    if (!password) {
      toast.error("Please fill in your password.");
      return;
    }
    if (!confirmPassword) {
      toast.error("Please confirm your password.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    if (!phone) {
      toast.error("Please enter your phone number.");
      return;
    }

    signUpMutation.mutate({
      name,
      email,
      password,
      password_confirmation: confirmPassword,
      role: 'student',
      school_id: Number(selectedSchool),
      phone,
      allergies: selectedAllergies,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 py-8">
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
          <h1 className="text-2xl font-semibold text-gray-900">Create Account</h1>
          <p className="text-gray-500">Sign up to get started</p>
        </div>

        {/* Sign Up Form */}
        <div className="space-y-4">
          <div className="space-y-3">
            <Input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 bg-gray-100 border-0 text-base"
            />

            <Select value={selectedSchool} onValueChange={setSelectedSchool} disabled={loadingSchools}>
              <SelectTrigger className="h-12 bg-gray-100 border-0 text-base">
                <SelectValue placeholder={loadingSchools ? "Loading schools..." : "Select your school"} />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                {schools.map((school) => (
                  <SelectItem key={school.id} value={String(school.id)}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Allergies Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Allergies (Select all that apply)</label>
              <div className="bg-gray-100 rounded-xl p-4 max-h-32 overflow-y-auto">
                <div className="grid grid-cols-2 gap-2">
                  {allergies.map((allergy) => (
                    <div key={allergy} className="flex items-center space-x-2">
                      <Checkbox
                        id={allergy}
                        checked={selectedAllergies.includes(allergy)}
                        onCheckedChange={(checked) => handleAllergyChange(allergy, checked as boolean)}
                        className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                      />
                      <label htmlFor={allergy} className="text-sm text-gray-700 cursor-pointer">
                        {allergy}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
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
            <Input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-12 bg-gray-100 border-0 text-base"
            />
            <Input
              type="text"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-12 bg-gray-100 border-0 text-base"
            />
          </div>

          <Button 
            onClick={handleSignUp}
            disabled={signUpMutation.isPending}
            className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl"
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
          <span className="text-gray-500">Already have an account? </span>
          <button 
            onClick={() => navigate("/")}
            className="text-blue-500 font-medium"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
