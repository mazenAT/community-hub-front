import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import MobileErrorBoundary from "@/components/MobileErrorBoundary";
import MobileNetworkStatus from "@/components/MobileNetworkStatus";
import { TutorialProvider } from "@/contexts/TutorialContext";
import TutorialOverlay from "@/components/TutorialOverlay";
import { useDeepLinking } from "@/hooks/useDeepLinking";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import FamilyMemberSetup from "./pages/FamilyMemberSetup";
import Wallet from "./pages/Wallet";
import Planner from "./pages/Planner";
import Recharge from "./pages/Recharge";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import OrderDetails from "./pages/orders/OrderDetails";

import MyOrders from "./pages/orders/MyOrders";
import FawryCallback from "./pages/FawryCallback";
import ContactUs from "./pages/ContactUs";
import Notifications from "./pages/Notifications";

const queryClient = new QueryClient();

const AppContent = () => {
  // Initialize deep linking for mobile app
  useDeepLinking();

  return (
    <BrowserRouter>
      <Routes>
          {/* Public Routes */}
          <Route path="/" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/fawry-callback" element={<FawryCallback />} />

          {/* Protected Routes */}
          <Route path="/family-setup" element={
            <ProtectedRoute>
              <FamilyMemberSetup />
            </ProtectedRoute>
          } />

          {/* Protected User Routes */}
          <Route path="/wallet" element={
            <ProtectedRoute>
              <Wallet />
            </ProtectedRoute>
          } />
          <Route path="/planner" element={
            <ProtectedRoute>
              <Planner />
            </ProtectedRoute>
          } />
          <Route path="/recharge" element={
            <ProtectedRoute>
              <Recharge />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/contact" element={
            <ProtectedRoute>
              <ContactUs />
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          } />

          <Route path="/orders/:id" element={
            <ProtectedRoute>
              <OrderDetails />
            </ProtectedRoute>
          } />
          <Route path="/orders/my-orders" element={
            <ProtectedRoute>
              <MyOrders />
            </ProtectedRoute>
          } />

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <MobileErrorBoundary>
        <MobileNetworkStatus />
        <TutorialProvider>
          <AppContent />
          <TutorialOverlay />
        </TutorialProvider>
      </MobileErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
