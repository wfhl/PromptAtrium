import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

// Define the context shape
interface AdminModeContextType {
  isAdminMode: boolean;
  toggleAdminMode: () => void;
  setAdminMode: (value: boolean) => void;
  verifyingAdmin: boolean;
  canAccessAdmin: boolean;
}

// Create the context with default values
const AdminModeContext = createContext<AdminModeContextType>({
  isAdminMode: false,
  toggleAdminMode: () => {},
  setAdminMode: () => {},
  verifyingAdmin: false,
  canAccessAdmin: false
});

// Admin mode password
const ADMIN_PASSWORD = "squiddy";

// Hook for consuming the context
export const useAdminMode = () => useContext(AdminModeContext);

// Provider component
interface AdminModeProviderProps {
  children: ReactNode;
}

export const AdminModeProvider: React.FC<AdminModeProviderProps> = ({ children }) => {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [verifyingAdmin, setVerifyingAdmin] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Check if user has system administrator role
  const canAccessAdmin = user?.roles?.some(role => 
    role.role_name === 'System Administrator' || 
    role.role_name === 'system_administrator'
  ) || false;

  // On component mount, check localStorage for saved preference
  useEffect(() => {
    try {
      const savedAdminMode = localStorage.getItem('elite_admin_mode');
      if (savedAdminMode === 'true') {
        setIsAdminMode(true);
      }
    } catch (error) {
      console.error('Error reading admin mode from localStorage:', error);
    }
  }, []);

  // Update localStorage when admin mode changes
  useEffect(() => {
    try {
      localStorage.setItem('elite_admin_mode', isAdminMode.toString());
    } catch (error) {
      console.error('Error saving admin mode to localStorage:', error);
    }
  }, [isAdminMode]);

  const verifyPassword = (password: string) => {
    if (password === ADMIN_PASSWORD) {
      setIsAdminMode(true);
      setVerifyingAdmin(false);
      toast({
        title: "Admin Mode Enabled",
        description: "You now have access to admin features.",
      });
      return true;
    } else {
      toast({
        title: "Incorrect Password",
        description: "The password you entered is incorrect.",
        variant: "destructive"
      });
      return false;
    }
  };

  const toggleAdminMode = () => {
    if (isAdminMode) {
      // Going from admin to user mode doesn't require password
      setIsAdminMode(false);
      toast({
        title: "User Mode Enabled",
        description: "Admin features are now disabled.",
      });
    } else {
      // Going from user to admin mode requires password verification
      setVerifyingAdmin(true);
    }
  };

  // Function to directly set admin mode (used primarily for internal logic)
  const setAdminModeDirectly = (value: boolean) => {
    if (value && !isAdminMode) {
      // If trying to enable admin mode, we still need password verification
      setVerifyingAdmin(true);
    } else {
      setIsAdminMode(value);
    }
  };

  return (
    <AdminModeContext.Provider 
      value={{ 
        isAdminMode, 
        toggleAdminMode, 
        setAdminMode: setAdminModeDirectly,
        verifyingAdmin,
        canAccessAdmin
      }}
    >
      {children}
      {verifyingAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg w-96 border border-gray-700">
            <h2 className="text-xl font-bold mb-4 text-white">Admin Authentication</h2>
            <p className="mb-4 text-gray-300">Please enter the admin password to continue:</p>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const password = formData.get('password') as string;
              verifyPassword(password);
            }}>
              <input 
                type="password" 
                name="password"
                className="w-full p-2 mb-4 bg-gray-800 border border-gray-700 text-white rounded"
                placeholder="Enter password"
                autoFocus
              />
              <div className="flex justify-end space-x-2">
                <button 
                  type="button"
                  onClick={() => setVerifyingAdmin(false)}
                  className="px-4 py-2 rounded bg-gray-800 text-white hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700"
                >
                  Authenticate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminModeContext.Provider>
  );
};