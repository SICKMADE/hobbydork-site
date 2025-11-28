'use client';

import type { User } from '@/lib/types';
import { mockUsers } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface AuthContextType {
  user: User | null;
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
    const foundUser = mockUsers.find((u) => u.email === email);
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
      description: 'Invalid email or password.',
      variant: 'destructive',
    });
    return false;
  }, [toast]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('vaultverse-user');
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
  }, [toast]);

  const signup = useCallback((name: string, email: string): boolean => {
    if (mockUsers.some((u) => u.email === email)) {
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
    mockUsers.push(newUser); // In a real app, this would be an API call
    setUser(newUser);
    localStorage.setItem('vaultverse-user', JSON.stringify(newUser));
    toast({
      title: 'Signup Successful!',
      description: `Welcome, ${name}! Your account is created with limited access.`,
    });
    return true;
  }, [toast]);

  const value = { user, login, logout, signup };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <div className="flex items-center justify-center h-screen">Loading...</div> : children}
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
