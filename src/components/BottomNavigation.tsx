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
      name: "View Menu",
      icon: Calendar,
      path: "/planner",
      active: location.pathname === "/planner",
    },
    {
      name: "Contact Us",
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
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-brand-red via-brand-orange to-brand-yellow border-t border-gray-200">
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => (
          <button
            key={tab.name}
            onClick={() => navigate(tab.path)}
            data-tutorial={
              tab.name === "Wallet" ? "wallet-nav" :
              tab.name === "View Menu" ? "meal-nav" :
              tab.name === "Profile" ? "profile-nav" :
              "contact-nav"
            }
            className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
              tab.active
                ? "text-white"
                : "text-white/80 hover:text-white"
            }`}
          >
            <tab.icon className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">{tab.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BottomNavigation;
