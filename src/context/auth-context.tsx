"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { Staff } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

interface AuthContextType {
  user: Staff | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const validUsers = [
    { email: 'admin@svcet.com', password: 'Admin@789', name: 'Admin Staff', id: 'admin', role: 'admin' as const },
    { email: 'dean@svcet.com', password: 'Dean@789', name: 'Dean', id: 'dean', role: 'admin' as const },
    { email: 'viewer@svcet.com', password: 'Viewer@789', name: 'Viewer', id: 'viewer', role: 'viewer' as const },
];


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('svcet_late_tracker_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('svcet_late_tracker_user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (email: string, password: string): boolean => {
    const foundUser = validUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (foundUser) {
      const staffUser: Staff = {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        role: foundUser.role,
      };
      setUser(staffUser);
      localStorage.setItem('svcet_late_tracker_user', JSON.stringify(staffUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('svcet_late_tracker_user');
    router.push('/login');
  };

  if (loading) {
    return <div className="w-full h-screen flex items-center justify-center">
      <Skeleton className="w-1/2 h-32" />
    </div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
