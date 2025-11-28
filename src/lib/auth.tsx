'use client';

import type { User } from '@/lib/types';
import { mockUsers } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string) => boolean;
  logout: () => void;
  signup: (name: string, email: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    try {
      setLoading(true);
      const storedUser = localStorage.getItem('vaultverse-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('vaultverse-user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback((email: string): boolean => {
    const foundUser = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('vaultverse-user', JSON.stringify(foundUser));
      toast({
        title: 'Login Successful',
        description: `Welcome back, ${foundUser.name}!`,
      });
      return true;
    }
    toast({
      title: 'Login Failed',
      description: 'No user found with that email.',
      variant: 'destructive',
    });
    return false;
  }, [toast]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('vaultverse-user');
    // a full page reload to ensure all state is cleared.
    window.location.href = '/';
  }, []);

  const signup = useCallback((name: string, email: string): boolean => {
    if (mockUsers.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      toast({
        title: 'Signup Failed',
        description: 'An account with this email already exists.',
        variant: 'destructive',
      });
      return false;
    }
    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      avatar: `https://picsum.photos/seed/${Date.now()}/100/100`,
      status: 'LIMITED', // New users start as limited
    };
    // In a real app, this would be an API call. For now, we just add to the mock array.
    mockUsers.push(newUser); 
    setUser(newUser);
    localStorage.setItem('vaultverse-user', JSON.stringify(newUser));
    toast({
      title: 'Signup Successful!',
      description: `Welcome, ${name}! Your account has been created.`,
    });
    return true;
  }, [toast]);

  const value = { user, loading, login, logout, signup };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
