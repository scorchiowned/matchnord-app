'use client';

import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { Trophy, Menu, X, User, Shield, LogOut, Users } from 'lucide-react';
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RoleIndicatorCompact } from '@/components/ui/role-indicator';

export function LandingNavigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const t = useTranslations();

  const user = session?.user;
  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'ADMIN';
  const isTeamManager = user?.role === 'TEAM_MANAGER';
  const isLoading = status === 'loading';

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-style-border bg-style-background/95 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <Trophy className="h-8 w-8 text-style-primary" />
              <span className="text-xl font-bold">{t('common.appName')}</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            {!isLoading && user ? (
              // Authenticated user navigation
              <>
                <Link
                  href="/tournaments"
                  className="text-sm font-medium text-style-text-secondary transition-colors hover:text-style-primary"
                >
                  {t('navigation.tournaments')}
                </Link>
                <Link
                  href="/teams"
                  className="text-sm font-medium text-style-text-secondary transition-colors hover:text-style-primary"
                >
                  {t('team.teams')}
                </Link>
                {/* Admin-only navigation */}
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="text-sm font-medium text-orange-600 transition-colors hover:text-primary"
                  >
                    {t('navigation.admin')}
                  </Link>
                )}
              </>
            ) : (
              // Unauthenticated user navigation
              <>
                <Link
                  href="/tournaments"
                  className="text-sm font-medium text-style-text-secondary transition-colors hover:text-style-primary"
                >
                  {t('navigation.tournaments')}
                </Link>
                <Link
                  href="/results"
                  className="text-sm font-medium text-style-text-secondary transition-colors hover:text-style-primary"
                >
                  {t('navigation.results')}
                </Link>
              </>
            )}
            <LanguageSwitcher />
            <div className="flex items-center space-x-3">
              {!isLoading && user ? (
                <>
                  <RoleIndicatorCompact />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="relative h-8 w-8 rounded-full"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={''} alt={user.name} />
                          <AvatarFallback>
                            {getUserInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {user.name}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/profile">
                          <User className="mr-2 h-4 w-4" />
                          {t('common.profile')}
                        </Link>
                      </DropdownMenuItem>
                      {user.role === 'ADMIN' && (
                        <>
                          <DropdownMenuItem asChild>
                            <Link href="/admin">
                              <Shield className="mr-2 h-4 w-4" />
                              {t('admin.dashboard')}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/admin/registrations">
                              <Users className="mr-2 h-4 w-4" />
                              {t('registration.title')}
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => signOut()}>
                        <LogOut className="mr-2 h-4 w-4" />
                        {t('auth.signOut')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : !isLoading ? (
                <>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/auth/signin">{t('auth.signIn')}</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/auth/signup">{t('auth.signUp')}</Link>
                  </Button>
                </>
              ) : (
                <div className="h-8 w-16 animate-pulse rounded bg-muted" />
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              className="text-style-text-primary"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="border-t border-style-border bg-style-background md:hidden">
            <div className="space-y-1 px-2 pb-3 pt-2">
              {!isLoading && user ? (
                // Authenticated user mobile navigation
                <>
                  <Link
                    href="/tournaments"
                    className="block px-3 py-2 text-base font-medium text-style-text-secondary transition-colors hover:text-style-primary"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('navigation.tournaments')}
                  </Link>
                  <Link
                    href="/teams"
                    className="block px-3 py-2 text-base font-medium text-style-text-secondary transition-colors hover:text-style-primary"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('team.teams')}
                  </Link>
                  {/* Admin-only mobile navigation */}
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="block px-3 py-2 text-base font-medium text-orange-600 transition-colors hover:text-primary"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {t('navigation.admin')}
                    </Link>
                  )}
                </>
              ) : (
                // Unauthenticated user mobile navigation
                <>
                  <Link
                    href="/tournaments"
                    className="block px-3 py-2 text-base font-medium text-style-text-secondary transition-colors hover:text-style-primary"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('navigation.tournaments')}
                  </Link>
                  <Link
                    href="/results"
                    className="block px-3 py-2 text-base font-medium text-style-text-secondary transition-colors hover:text-style-primary"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('navigation.results')}
                  </Link>
                </>
              )}
              <div className="px-3 py-2">
                <LanguageSwitcher />
              </div>
              <div className="border-t pt-4">
                <div className="mb-4">
                  <LanguageSwitcher />
                </div>
                {!isLoading && user ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={''} alt={user.name} />
                        <AvatarFallback>
                          {getUserInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    {user.role === 'ADMIN' && (
                      <>
                        <Button variant="outline" className="w-full" asChild>
                          <Link
                            href="/admin"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            {t('admin.dashboard')}
                          </Link>
                        </Button>
                        <Button variant="outline" className="w-full" asChild>
                          <Link
                            href="/admin/registrations"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            {t('registration.title')}
                          </Link>
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => signOut()}
                    >
                      {t('auth.signOut')}
                    </Button>
                  </div>
                ) : !isLoading ? (
                  <div className="space-y-2">
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="w-full"
                    >
                      <Link
                        href="/auth/signin"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {t('auth.signIn')}
                      </Link>
                    </Button>
                    <Button asChild size="sm" className="w-full">
                      <Link
                        href="/auth/signup"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {t('auth.signUp')}
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="h-8 w-16 animate-pulse rounded bg-muted" />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
