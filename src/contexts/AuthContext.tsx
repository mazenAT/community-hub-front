import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, familyMembersApi } from '@/services/api';
import { secureStorage } from '@/services/native';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  school_id?: number;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        // Verify token is still valid by making a test API call
        try {
          const response = await authApi.me();
          const userData = response.data;
          
          setToken(storedToken);
          setUser(userData);
          setIsAuthenticated(true);
          
          // Update stored user data in case there are any changes
          localStorage.setItem('user', JSON.stringify(userData));
          
        } catch (error) {
          // Token is invalid, clear storage
          console.warn('Token validation failed:', error);
          logout();
        }
      } else {
        // No token found, user needs to login
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      const { user: userData, token: userToken } = response.data;
      
      // Store in localStorage
      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Update state
      setToken(userToken);
      setUser(userData);
      setIsAuthenticated(true);
      
      // Check family members and navigate appropriately
      try {
        const familyMembersResponse = await familyMembersApi.getFamilyMembers();
        const familyMembers = familyMembersResponse.data;
        
        if (familyMembers && familyMembers.length > 0) {
          await secureStorage.set('has-family-members', 'true');
          navigate("/wallet");
        } else {
          await secureStorage.set('has-family-members', 'false');
          navigate("/family-member-setup");
        }
      } catch (error) {
        await secureStorage.set('has-family-members', 'false');
        navigate("/family-member-setup");
      }
      
    } catch (error) {
      console.error('Login failed:', error);
      throw error; // Re-throw to handle in component
    }
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Clear state
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    
    // Navigate to sign in
    navigate('/');
  };

  // Check auth status on component mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuthStatus,
  };

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size={48} />
          <p className="text-gray-600 text-lg font-medium">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 