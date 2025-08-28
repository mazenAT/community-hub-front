import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, ChevronRight, Calendar, AlertCircle, ShoppingBag } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import { Input } from "@/components/ui/input";
import { profileApi, walletApi } from "@/services/api";
import { format, parseISO } from 'date-fns';
import { formatCurrency } from "@/utils/format";
import { FamilyMembersSection } from "@/components/FamilyMembersSection";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  school_id: number | null;
  phone: string | null;
  profile_image: string | null;
  is_active: boolean;
  role: 'student';
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
    if (profileData) {
      setName(profileData.name || "");
      setEmail(profileData.email || "");
      setSchoolName(profileData.school?.name || "");
      setPhone(profileData.phone || "");
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
    mutationFn: profileApi.updateProfile,
    onSuccess: () => {
      toast.success("Profile updated successfully!");
      refetchProfile();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update profile");
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: profileApi.updatePassword,
    onSuccess: () => {
      toast.success("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update password");
    },
  });

  const handleUpdateProfile = () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    const updateData: any = { name: name.trim() };
    
    if (phone !== profileData?.phone) {
      updateData.phone = phone || null;
    }

    updateProfileMutation.mutate(updateData);
  };

  const handleUpdatePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All password fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    updatePasswordMutation.mutate({
      current_password: currentPassword,
      password: newPassword,
      password_confirmation: confirmPassword,
    });
  };

  const formatTime = (dateString: string) => {
    const date = parseISO(dateString);
    return format(date, 'hh:mm a');
  };

  const formatAmount = (amount: number, type: 'credit' | 'debit') => {
    const sign = type === 'debit' ? '-' : '+';
    return `${sign}${formatCurrency(Math.abs(amount))}`;
  };

  if (isLoadingProfile || isLoadingTransactions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (profileError || transactionsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 flex items-center justify-center">
        <div className="text-center p-6">
          <AlertCircle className="w-12 h-12 text-brand-red mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-brand-black mb-2">Error Loading Data</h2>
          <p className="text-brand-black/70 mb-4">There was a problem loading your profile or transactions. Please try again.</p>
          <Button onClick={() => { refetchProfile(); refetchTransactions(); }} className="bg-brand-red hover:bg-brand-red/90 text-white">
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
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 pb-20">
      {/* Header */}
      <div 
        className="bg-gradient-to-r from-brand-red via-brand-orange to-brand-yellow px-4 sm:px-6 py-4 border-b-2 border-brand-red"
        data-tutorial="profile-header"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-white">Profile</h1>
            <p className="text-xs sm:text-sm text-white/90">Manage your account</p>
          </div>
          <button 
            onClick={() => navigate("/orders")}
            className="bg-white/20 hover:bg-white/30 text-white px-3 sm:px-4 py-2 rounded-xl border border-white/30 flex items-center gap-2 transition-all duration-200 hover:scale-105"
          >
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base font-medium">My Orders</span>
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* User Info Card */}
        <Card className="p-4 sm:p-6 rounded-2xl border-0 bg-white">
          <div className="flex items-start justify-between mb-4 sm:mb-6">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-brand-yellow/20 rounded-full flex items-center justify-center border border-brand-yellow/30">
                <User className="w-6 h-6 sm:w-8 sm:h-8 text-brand-red" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-brand-black">
                  {user?.name}
                </h2>
                <p className="text-sm sm:text-base text-brand-black/70">{user?.email}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-brand-yellow/30">
              <span className="text-sm sm:text-base text-brand-black/70">School</span>
              <span className="text-sm sm:text-base font-medium text-brand-black">{schoolName}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm sm:text-base text-brand-black/70">Phone</span>
              <span className="text-sm sm:text-base font-medium text-brand-black">{user?.phone || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-t border-brand-yellow/30">
              <span className="text-sm sm:text-base text-brand-black/70">Wallet Balance</span>
              <span className="text-sm sm:text-base font-medium text-brand-black">{formatAmount(balance, 'credit')}</span>
            </div>
            {/* Allergies Badges (non-editable, no duplicates) */}
            {/* Removed allergies section as per edit hint */}
          </div>
        </Card>

        {/* Family Members Section */}
        <div data-tutorial="profile-family-section">
          <FamilyMembersSection />
        </div>

        {/* Edit Profile Section */}
        <Card className="p-4 sm:p-6 rounded-2xl border-0 bg-white" data-tutorial="profile-edit">
          <h3 className="text-lg sm:text-xl font-semibold text-brand-black mb-4 sm:mb-6">Edit Profile</h3>
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-sm font-medium text-brand-black mb-2">Name</label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-black mb-2">Phone</label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                className="w-full"
              />
            </div>
            {/* Removed Allergies input field */}
            <Button 
              onClick={handleUpdateProfile}
              disabled={updateProfileMutation.isPending}
              className="w-full bg-brand-red hover:bg-brand-red/90 text-white"
            >
              {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
            </Button>
          </div>
        </Card>

        {/* Change Password Section */}
        <Card className="p-4 sm:p-6 rounded-2xl border-0 bg-white">
          <h3 className="text-lg sm:text-xl font-semibold text-brand-black mb-4 sm:mb-6">Change Password</h3>
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-sm font-medium text-brand-black mb-2">Current Password</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-black mb-2">New Password</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-black mb-2">Confirm New Password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full"
              />
            </div>
            <Button 
              onClick={handleUpdatePassword}
              disabled={updatePasswordMutation.isPending}
              className="w-full bg-brand-red hover:bg-brand-red/90 text-white"
            >
              {updatePasswordMutation.isPending ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </Card>

        {/* Transaction History */}
        <Card className="p-4 sm:p-6 rounded-2xl border-0 bg-white" data-tutorial="profile-settings">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-semibold text-brand-black">Transaction History</h3>
            <div className="text-sm text-brand-black/70">
              Total: {totalTransactions} transactions
            </div>
          </div>
          
          {transactionsData && transactionsData.length > 0 ? (
            <div className="space-y-3">
              {transactionsData.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${transaction.type === 'credit' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <div>
                      <p className="font-medium text-brand-black">{transaction.note || 'Transaction'}</p>
                      <p className="text-sm text-brand-black/60">{formatTime(transaction.created_at)}</p>
                    </div>
                  </div>
                  <div className={`font-semibold ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                    {formatAmount(transaction.amount, transaction.type)}
                  </div>
                </div>
              ))}
              {transactionsData.length > 5 && (
                <Button 
                  onClick={() => navigate("/wallet")}
                  variant="outline" 
                  className="w-full mt-4 border-brand-red text-brand-red hover:bg-brand-red hover:text-white"
                >
                  View All Transactions
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-brand-black/30 mx-auto mb-3" />
              <p className="text-brand-black/60">No transactions yet</p>
              <Button 
                onClick={() => navigate("/wallet")}
                variant="outline" 
                className="mt-3 border-brand-red text-brand-red hover:bg-brand-red hover:text-white"
              >
                Go to Wallet
              </Button>
            </div>
          )}
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Profile;
