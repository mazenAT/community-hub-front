/**
 * Utility function for handling authentication errors consistently across components
 * @param error - The error object from API calls
 * @param logout - The logout function from AuthContext
 * @returns boolean - true if auth error was handled, false if not an auth error
 */
export const handleAuthError = (error: any, logout: () => void): boolean => {
  if (error?.response?.status === 401 || error?.response?.status === 403) {
    console.warn('Authentication failed, logging out user');
    logout();
    return true; // Indicates auth error was handled
  }
  return false; // Not an auth error
};