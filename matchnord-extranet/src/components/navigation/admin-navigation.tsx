'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useSession, signOut } from 'next-auth/react';
import { LogOut, Shield, Menu, X, Users } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function AdminNavigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: session } = useSession();
  const user = session?.user;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleSignOut = () => {
    signOut();
  };

  return (
    <nav className="border-style-border bg-style-background border-b">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Link href="/admin" className="flex items-center space-x-2">
              <Shield className="text-style-primary h-8 w-8" />
              <span className="text-xl font-bold">Admin Panel</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            <Link
              href="/admin/tournaments"
              className="hover:text-style-primary text-sm font-medium"
            >
              Tournaments
            </Link>
            <Link
              href="/admin/teams"
              className="hover:text-style-primary text-sm font-medium"
            >
              Teams
            </Link>
            <Link
              href="/admin/venues"
              className="hover:text-style-primary text-sm font-medium"
            >
              Venues
            </Link>
            <Link
              href="/admin/users"
              className="hover:text-style-primary text-sm font-medium"
            >
              Users
            </Link>
            <Link
              href="/admin/matches"
              className="hover:text-style-primary text-sm font-medium"
            >
              Matches
            </Link>
            <Link
              href="/admin/registrations"
              className="hover:text-style-primary text-sm font-medium"
            >
              Registrations
            </Link>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {user.name && <p className="font-medium">{user.name}</p>}
                      {user.email && (
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <Shield className="mr-2 h-4 w-4" />
                      Admin Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/registrations">
                      <Users className="mr-2 h-4 w-4" />
                      Manage Registrations
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link href="/test-auth">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/test-auth">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              className="p-2"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="border-t py-4 md:hidden">
            <div className="flex flex-col space-y-2">
              <Link
                href="/admin/tournaments"
                className="hover:text-style-primary text-sm font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Tournaments
              </Link>
              <Link
                href="/admin/teams"
                className="hover:text-style-primary text-sm font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Teams
              </Link>
              <Link
                href="/admin/venues"
                className="hover:text-style-primary text-sm font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Venues
              </Link>
              <Link
                href="/admin/users"
                className="hover:text-style-primary text-sm font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Users
              </Link>
              <Link
                href="/admin/matches"
                className="hover:text-style-primary text-sm font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Matches
              </Link>
              <Link
                href="/admin/registrations"
                className="hover:text-style-primary text-sm font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Registrations
              </Link>
            </div>

            {/* Mobile User Menu */}
            {user ? (
              <div className="mt-4 border-t pt-4">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex flex-col space-y-2">
                  <Link
                    href="/admin"
                    className="flex items-center text-sm hover:text-primary"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Admin Dashboard
                  </Link>
                  <Link
                    href="/admin/registrations"
                    className="flex items-center text-sm hover:text-primary"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Manage Registrations
                  </Link>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      handleSignOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="justify-start"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 border-t pt-4">
                <div className="flex flex-col space-y-2">
                  <Link
                    href="/test-auth"
                    className="flex items-center text-sm hover:text-primary"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/test-auth"
                    className="flex items-center text-sm hover:text-primary"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
