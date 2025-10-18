
"use client";

import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, LogOut, BarChart3, Users, Warehouse, Trash2, Home } from 'lucide-react';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

export function Header() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();


  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-primary px-4 text-primary-foreground sm:px-6">
      <Link href="/dashboard" className="flex items-center gap-2">
        <Image src="/svcet-logo.png" alt="Logo" width={40} height={40} />
        <h1 className="text-xl font-bold font-headline tracking-tight">
            SVCET - Late Tracker
        </h1>
      </Link>
      <div className="ml-auto flex items-center gap-2 md:gap-4">
        {user?.role !== 'viewer' && (
          <div className="hidden md:flex items-center gap-2 md:gap-4">
              <Button variant="ghost" className="hover:bg-primary-foreground/10" onClick={() => router.push('/dashboard')}>
                    <Home className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Home</span>
                </Button>
            {pathname.startsWith('/dashboard') && (
                <Button variant="ghost" className="hover:bg-primary-foreground/10" onClick={() => router.push('/dashboard/class-strength')}>
                    <Users className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Class Strength</span>
                </Button>
            )}
            {pathname.startsWith('/dashboard') && (
                <Button variant="ghost" className="hover:bg-primary-foreground/10" onClick={() => router.push('/dashboard/batch-strength')}>
                    <Warehouse className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Batch Strength</span>
                </Button>
            )}
            {pathname.startsWith('/dashboard') && !pathname.endsWith('analytics') && (
              <Button variant="ghost" className="hover:bg-primary-foreground/10" onClick={() => router.push('/dashboard/analytics')}>
                <BarChart3 className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">View Analytics</span>
              </Button>
            )}
          </div>
        )}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:bg-primary-foreground/10">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary-foreground text-primary">{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {user?.role === 'admin' && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Cleanup Records</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={() => router.push('/cleanup-last')}>
                        Delete Last Record
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push('/cleanup')}>
                        Delete Today's Records
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push('/cleanup-old')}>
                        Delete Old Records
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              )}
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
