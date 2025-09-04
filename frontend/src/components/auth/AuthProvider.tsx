import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import type { User, AuthContextType } from '../../types';

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { user: clerkUser, isLoaded } = useUser();
  const { getToken: clerkGetToken } = useClerkAuth();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (isLoaded && clerkUser) {
      setUser({
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        clerkId: clerkUser.id
      });
    } else {
      setUser(null);
    }
  }, [clerkUser, isLoaded]);

  const getToken = async (): Promise<string> => {
    if (!clerkUser) {
      throw new Error('User not authenticated');
    }
    
    try {
      const token = await clerkGetToken();
      return token || '';
    } catch (error) {
      console.error('Error getting auth token:', error);
      throw error;
    }
  };

  const contextValue: AuthContextType = {
    user,
    isAuthenticated: !!user,
    getToken
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};