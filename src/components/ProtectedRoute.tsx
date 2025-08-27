import { Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useTutorial } from "@/contexts/TutorialContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const token = localStorage.getItem("token");
  const { checkTutorialStatus } = useTutorial();

  useEffect(() => {
    if (token) {
      // Check if tutorial should be shown after sign-in
      checkTutorialStatus();
    }
  }, [token, checkTutorialStatus]);

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 