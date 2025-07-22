import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, ChevronRight, Calendar, DollarSign, AlertCircle } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import { Input } from "@/components/ui/input";
import { profileApi, walletApi } from "@/services/api";
import { format, parseISO } from 'date-fns';
import { formatCurrency } from "@/utils/format";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  school_id: number | null;
  phone: string | null;
  profile_image: string | null;
  is_active: boolean;
  role: 'admin' | 'student';
  school?: {
    id: number;
    name: string;
  };
  wallet?: {
    id: number;
    user_id: number;
    balance: number;
    currency: string;
    is_active: boolean;
  };
  allergies?: string[];
}

interface Transaction {
  id: number;
  wallet_id: number;
  type: 'credit' | 'debit';
  amount: number;
  note: string | null;
  created_at: string;
  updated_at: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [allergiesInput, setAllergiesInput] = useState("");

  const { data: profileResponse, isLoading: isLoadingProfile, error: profileError, refetch: refetchProfile } = useQuery<{ data: UserProfile }>({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await profileApi.getProfile();
      // Profile API returns user object directly, not wrapped in 'data'
      return { data: response.data };
    },
    retry: 3,
    retryDelay: 1000,
  });

  const profileData = profileResponse?.data;

  useEffect(() => {
    setAllergies([
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
    ]);
    if (profileData) {
      setName(profileData.name || "");
      setEmail(profileData.email || "");
      setSchoolName(profileData.school?.name || "");
      setPhone(profileData.phone || "");
      setSelectedAllergies(Array.isArray(profileData.allergies) ? profileData.allergies : []);
      setAllergiesInput(Array.isArray(profileData.allergies) ? profileData.allergies.join(", ") : (profileData.allergies || ""));
    }
  }, [profileData]);

  const { data: transactionsResponse, isLoading: isLoadingTransactions, error: transactionsError, refetch: refetchTransactions } = useQuery<{ data: Transaction[] }>({
    queryKey: ["transactions"],
    queryFn: async () => {
      const response = await walletApi.getTransactions();
      // Transactions API uses successResponse which wraps in { success: true, data: [...] }
      return response.data?.data ? response.data : { data: response.data };
    },
    retry: 3,
    retryDelay: 1000,
  });

  const transactionsData = transactionsResponse?.data;

  const updateProfileMutation = useMutation({
    mutationFn: (data: { name?: string; phone?: string | null; allergies?: string[]; }) => profileApi.updateProfile(data).then(response => response.data),
    onSuccess: () => {
      toast.success("Profile updated successfully");
      refetchProfile();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update profile");
    },
  });

  const handleChangePasswordMutation = useMutation({
    mutationFn: (data: { current_password: string; password: string; password_confirmation: string; }) => profileApi.updatePassword(data).then(response => response.data),
    onSuccess: () => {
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to change password");
    },
  });

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

  const handleUpdateProfile = () => {
    updateProfileMutation.mutate({ name, phone, allergies: allergiesInput.split(",").map(a => a.trim()).filter(Boolean) });
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long");
      return;
    }

    handleChangePasswordMutation.mutate({
      current_password: currentPassword,
      password: newPassword,
      password_confirmation: confirmPassword,
    });
  };

  const [selectedFilter, setSelectedFilter] = useState<"all" | "credit" | "debit">("all");

  const filteredTransactions = transactionsData?.filter((transaction: Transaction) => {
    if (selectedFilter === "all") return true;
    return transaction.type === selectedFilter;
  }) || [];

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = parseISO(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return "Today";
    } else if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
      return "Yesterday";
    } else {
      return format(date, 'MMM d, yyyy');
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return "";
    const date = parseISO(dateString);
    return format(date, 'hh:mm a');
  };

  const formatAmount = (amount: number, type: 'credit' | 'debit') => {
    const sign = type === 'debit' ? '-' : '+';
    return `${sign}${formatCurrency(Math.abs(amount))}`;
  };

  if (isLoadingProfile || isLoadingTransactions) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (profileError || transactionsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-6">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">There was a problem loading your profile or transactions. Please try again.</p>
          <Button onClick={() => { refetchProfile(); refetchTransactions(); }} className="bg-blue-500 hover:bg-blue-600 text-white">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const user = profileData;
  const balance = Number(user?.wallet?.balance) || 0;

  const totalSpent = transactionsData?.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0) || 0;
  const totalTransactions = transactionsData?.length || 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white px-4 sm:px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Profile</h1>
            <p className="text-xs sm:text-sm text-gray-500">Manage your account</p>
          </div>
          <button 
            onClick={() => navigate("/wallet")}
            className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-300 rounded-full flex items-center justify-center"
          >
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* User Info Card */}
        <Card className="p-4 sm:p-6 rounded-2xl border-0 bg-white">
          <div className="flex items-start justify-between mb-4 sm:mb-6">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  {user?.name}
                </h2>
                <p className="text-sm sm:text-base text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm sm:text-base text-gray-600">School</span>
              <span className="text-sm sm:text-base font-medium text-gray-900">{schoolName}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm sm:text-base text-gray-600">Phone</span>
              <span className="text-sm sm:text-base font-medium text-gray-900">{user?.phone || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-t border-gray-100">
              <span className="text-sm sm:text-base text-gray-600">Wallet Balance</span>
              <span className="text-sm sm:text-base font-medium text-gray-900">{formatAmount(balance, 'credit')}</span>
            </div>
            {/* Allergies Badges (non-editable, no duplicates) */}
            {allergiesInput && (
              <div className="mt-4">
                <div className="text-sm font-semibold text-gray-700 mb-1">Allergies</div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {[...new Set(allergiesInput.split(',').map(a => a.trim()).filter(Boolean))].map((allergy, idx) => (
                    <span
                      key={idx}
                      className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold shadow-sm border border-blue-200"
                    >
                      {allergy}
                    </span>
                  ))}
                </div>
                <Button
                  className="bg-blue-500 hover:bg-blue-600 text-white mb-4"
                  onClick={() => navigate('/orders/my-orders')}
                >
                  My Orders
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Update Profile */}
        <Card className="p-4 sm:p-6 rounded-2xl border-0 bg-white">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Update Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Phone</label>
                <Input
                  type="tel"
                  value={phone || ''}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-12 bg-gray-50"
                />
              </div>
            </div>
            <Button
              onClick={handleUpdateProfile}
              disabled={updateProfileMutation.isPending}
              className="w-full md:w-auto bg-blue-500 hover:bg-blue-600 text-white"
            >
              {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </Card>

        {/* Change Password */}
        <Card className="p-4 sm:p-6 rounded-2xl border-0 bg-white">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Current Password</label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="h-12 bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">New Password</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-12 bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 bg-gray-50"
                />
              </div>
            </div>
            <Button
              onClick={handleChangePassword}
              disabled={handleChangePasswordMutation.isPending}
              className="w-full md:w-auto bg-blue-500 hover:bg-blue-600 text-white"
            >
              {handleChangePasswordMutation.isPending ? "Changing..." : "Change Password"}
            </Button>
          </div>
        </Card>

        {/* Financial Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <Card className="p-4 sm:p-6 rounded-2xl border-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <DollarSign className="w-6 h-6 sm:w-8 sm:h-8" />
              <div>
                <p className="text-sm sm:text-base text-blue-100">Wallet Balance</p>
                <p className="text-lg sm:text-xl font-bold">{formatAmount(balance, 'credit')}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 sm:p-6 rounded-2xl border-0 bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Calendar className="w-6 h-6 sm:w-8 sm:h-8" />
              <div>
                <p className="text-sm sm:text-base text-purple-100">Total Transactions</p>
                <p className="text-lg sm:text-xl font-bold">{totalTransactions}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Transaction History */}
        <Card className="p-4 sm:p-6 rounded-2xl border-0 bg-white">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Transaction History</h3>
              <button className="flex items-center text-blue-600 text-sm font-medium">
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>

            {/* Filter Buttons */}
            <div className="flex space-x-2">
              {["all", "credit", "debit"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter as "all" | "credit" | "debit")}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    selectedFilter === filter
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>

            {/* Transactions List */}
            <div className="space-y-2 sm:space-y-3 max-h-64 sm:max-h-80 overflow-y-auto">
              {filteredTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${
                      transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {transaction.type === 'credit' ? (
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm sm:text-base font-medium text-gray-900">{transaction.note || transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {formatDate(transaction.created_at)}, {formatTime(transaction.created_at)}
                      </p>
                    </div>
                  </div>
                  <p className={`text-sm sm:text-base font-semibold ${
                    transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatAmount(transaction.amount, transaction.type)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <BottomNavigation activeTab="profile" />
    </div>
  );
};

export default Profile;
