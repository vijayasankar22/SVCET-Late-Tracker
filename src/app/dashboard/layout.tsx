
"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Skeleton } from '@/components/ui/skeleton';
import { BottomNavBar } from '@/components/bottom-nav-bar';
import { RealtimeNotificationListener } from '@/components/notification-listener';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex flex-col min-h-screen">
         <Skeleton className="h-16 w-full" />
         <div className="flex-1 p-4 sm:p-6 md:p-8 space-y-8">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
         </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 p-4 sm:p-6 md:p-8 pb-20 md:pb-8">
        {children}
      </main>
      <BottomNavBar />
      {user?.role === 'viewer' && <RealtimeNotificationListener />}
    </div>
  );
}
