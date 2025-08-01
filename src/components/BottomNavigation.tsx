import { useNavigate, useLocation } from "react-router-dom";
import { Wallet, Calendar, User, MessageCircle } from "lucide-react";

interface BottomNavigationProps {
  activeTab?: "wallet" | "planner" | "profile" | "contact";
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    {
      name: "Wallet",
      icon: Wallet,
      path: "/wallet",
      active: location.pathname === "/wallet",
    },
    {
      name: "Planner",
      icon: Calendar,
      path: "/planner",
      active: location.pathname === "/planner",
    },
    {
      name: "Contact",
      icon: MessageCircle,
      path: "/contact",
      active: location.pathname === "/contact",
    },
    {
      name: "Profile",
      icon: User,
      path: "/profile",
      active: location.pathname === "/profile",
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => (
          <button
            key={tab.name}
            onClick={() => navigate(tab.path)}
            className={`flex flex-col items-center justify-center w-full h-full ${
              tab.active
                ? "text-brand-red"
                : "text-gray-500 hover:text-brand-red"
            }`}
          >
            <tab.icon className="w-6 h-6" />
            <span className="text-xs mt-1">{tab.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BottomNavigation;
