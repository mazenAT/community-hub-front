import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import Wallet from "./pages/Wallet";
import Planner from "./pages/Planner";
import Recharge from "./pages/Recharge";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import RechargeHistory from "./pages/wallet/RechargeHistory";
import OrderDetails from "./pages/orders/OrderDetails";
import AddOns from "./pages/AddOns";
import MyOrders from "./pages/orders/MyOrders";
import FawryCallback from "./pages/FawryCallback";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/fawry-callback" element={<FawryCallback />} />

          {/* Protected User Routes */}
          <Route path="/wallet" element={
            <ProtectedRoute>
              <Wallet />
            </ProtectedRoute>
          } />
          <Route path="/wallet/history" element={
            <ProtectedRoute>
              <RechargeHistory />
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
          <Route path="/add-ons" element={
            <ProtectedRoute>
              <AddOns />
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
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
