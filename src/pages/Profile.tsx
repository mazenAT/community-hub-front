import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Edit3, ChevronRight, Calendar, DollarSign } from "lucide-react";
import BottomNavigation from "@/components/ui/BottomNavigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { profileApi } from "@/services/api";

const Profile = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [school, setSchool] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: profileApi.getProfile,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: {
      name?: string;
      email?: string;
      school?: string;
      phone?: string;
    }) => profileApi.updateProfile(data),
    onSuccess: () => {
      toast.success("Profile updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update profile");
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: {
      current_password: string;
      new_password: string;
      confirm_password: string;
    }) => profileApi.changePassword(data),
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

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setEmail(profile.email || "");
      setSchool(profile.school || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  const handleUpdateProfile = () => {
    updateProfileMutation.mutate({
      name,
      email,
      school,
      phone,
    });
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

    changePasswordMutation.mutate({
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
  };

  const userInfo = {
    firstName: "Alex",
    lastName: "Johnson",
    email: "alex.johnson@email.com",
    school: "American University in Cairo",
    allergies: ["Nuts", "Dairy"],
    joinDate: "January 2024",
    totalSpent: 3247.85,
    totalTransactions: 47
  };

  const allTransactions = [
    {
      id: 1,
      title: "Starbucks Coffee",
      date: "2024-06-01",
      time: "10:30 AM",
      amount: -18.75,
      type: "expense",
      status: "completed"
    },
    {
      id: 2,
      title: "Salary Deposit",
      date: "2024-06-01",
      time: "9:00 AM",
      amount: 11850.00,
      type: "income",
      status: "completed"
    },
    {
      id: 3,
      title: "Amazon.com",
      date: "2024-05-31",
      time: "3:45 PM",
      amount: -357.96,
      type: "expense",
      status: "completed"
    },
    {
      id: 4,
      title: "McDonald's",
      date: "2024-05-31",
      time: "1:20 PM",
      amount: -45.50,
      type: "expense",
      status: "completed"
    },
    {
      id: 5,
      title: "Wallet Recharge",
      date: "2024-05-30",
      time: "11:15 AM",
      amount: 1000.00,
      type: "income",
      status: "completed"
    },
    {
      id: 6,
      title: "Netflix Subscription",
      date: "2024-05-30",
      time: "8:00 AM",
      amount: -120.00,
      type: "expense",
      status: "completed"
    }
  ];

  const [selectedFilter, setSelectedFilter] = useState<"all" | "income" | "expense">("all");

  const filteredTransactions = allTransactions.filter(transaction => {
    if (selectedFilter === "all") return true;
    return transaction.type === selectedFilter;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

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
                  {name} {userInfo.lastName}
                </h2>
                <p className="text-sm sm:text-base text-gray-500">{email}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="p-2">
              <Edit3 className="w-4 h-4 text-gray-400" />
            </Button>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm sm:text-base text-gray-600">School</span>
              <span className="text-sm sm:text-base font-medium text-gray-900">{school}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm sm:text-base text-gray-600">Phone</span>
              <span className="text-sm sm:text-base font-medium text-gray-900">{phone}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm sm:text-base text-gray-600">Member since</span>
              <span className="text-sm sm:text-base font-medium text-gray-900">{userInfo.joinDate}</span>
            </div>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Card className="p-3 sm:p-4 rounded-xl border-0 bg-gradient-to-r from-green-500 to-green-600 text-white">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
              <div>
                <p className="text-xs sm:text-sm text-green-100">Total Spent</p>
                <p className="text-sm sm:text-lg font-bold">{userInfo.totalSpent.toFixed(2)} EGP</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-3 sm:p-4 rounded-xl border-0 bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
              <div>
                <p className="text-xs sm:text-sm text-purple-100">Transactions</p>
                <p className="text-sm sm:text-lg font-bold">{userInfo.totalTransactions}</p>
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
              {["all", "income", "expense"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter as "all" | "income" | "expense")}
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
                      transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {transaction.type === 'income' ? (
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
                      <p className="text-sm sm:text-base font-medium text-gray-900">{transaction.title}</p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {formatDate(transaction.date)}, {transaction.time}
                      </p>
                    </div>
                  </div>
                  <p className={`text-sm sm:text-base font-semibold ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}{Math.abs(transaction.amount).toFixed(2)} EGP
                  </p>
                </div>
              ))}
            </div>
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
                <label className="text-sm font-medium text-gray-700">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">School</label>
                <Input
                  type="text"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  className="h-12 bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Phone</label>
                <Input
                  type="tel"
                  value={phone}
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
              {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
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
              disabled={changePasswordMutation.isPending}
              className="w-full md:w-auto bg-blue-500 hover:bg-blue-600 text-white"
            >
              {changePasswordMutation.isPending ? "Changing Password..." : "Change Password"}
            </Button>
          </div>
        </Card>
      </div>

      <BottomNavigation activeTab="wallet" />
    </div>
  );
};

export default Profile;
