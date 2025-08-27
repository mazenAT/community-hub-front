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
import TutorialTrigger from "@/components/TutorialTrigger";
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
  return (
    <>
      {/* Initialize deep linking for mobile app - now inside Router context */}
      <DeepLinkingInitializer />
      <TutorialProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/fawry-callback" element={<FawryCallback />} />

          {/* Protected Routes */}
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/family-member-setup" element={<ProtectedRoute><FamilyMemberSetup /></ProtectedRoute>} />
          <Route path="/planner" element={<ProtectedRoute><Planner /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
          <Route path="/order/:id" element={<ProtectedRoute><OrderDetails /></ProtectedRoute>} />
          <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
          <Route path="/recharge" element={<ProtectedRoute><Recharge /></ProtectedRoute>} />
          <Route path="/contact" element={<ProtectedRoute><ContactUs /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <TutorialOverlay />
        <TutorialTrigger variant="floating" />
      </TutorialProvider>
    </>
  );
};

// Separate component to handle deep linking initialization
const DeepLinkingInitializer = () => {
  useDeepLinking();
  return null; // This component doesn't render anything
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <MobileErrorBoundary>
        <MobileNetworkStatus />
        <MobileErrorBoundary fallback={
          <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="text-center space-y-4">
              <div className="text-4xl">⚠️</div>
              <h1 className="text-xl font-semibold">Tutorial System Error</h1>
              <p className="text-sm text-muted-foreground">The tutorial system encountered an error.</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Reload App
              </button>
            </div>
          </div>
        }>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </MobileErrorBoundary>
      </MobileErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
