
import { useNavigate } from "react-router-dom";

interface BottomNavigationProps {
  activeTab: "wallet" | "planner";
}

const BottomNavigation = ({ activeTab }: BottomNavigationProps) => {
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
      <div className="flex items-center justify-around">
        <button
          onClick={() => navigate("/wallet")}
          className={`flex flex-col items-center space-y-1 ${
            activeTab === "wallet" ? "text-blue-500" : "text-gray-400"
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <span className="text-xs font-medium">Wallet</span>
          {activeTab === "wallet" && (
            <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
          )}
        </button>

        <button
          onClick={() => navigate("/planner")}
          className={`flex flex-col items-center space-y-1 ${
            activeTab === "planner" ? "text-blue-500" : "text-gray-400"
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs font-medium">Planner</span>
          {activeTab === "planner" && (
            <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
          )}
        </button>
      </div>
    </div>
  );
};

export default BottomNavigation;
