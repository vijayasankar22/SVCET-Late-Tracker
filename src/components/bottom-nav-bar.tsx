
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Warehouse, BarChart3, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';

export function BottomNavBar() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (user?.role === 'viewer') {
    return null;
  }

  const navItems = [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: '/dashboard/class-strength', label: 'Class', icon: Users },
    { href: '/dashboard/batch-strength', label: 'Batch', icon: Warehouse },
    { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur-sm md:hidden">
      <nav className="flex h-16 items-center justify-around">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center gap-1 p-2 rounded-md text-sm font-medium w-16 h-16 transition-colors',
              pathname === item.href
                ? 'text-primary'
                : 'text-muted-foreground hover:text-primary'
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
