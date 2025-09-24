'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home, ArrowLeft, Search, Trophy, Users, MapPin } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto py-12">
        <div className="mx-auto max-w-2xl text-center">
          <Card>
            <CardContent className="py-12">
              {/* 404 Icon */}
              <div className="mb-6">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-muted">
                  <Search className="h-12 w-12 text-muted-foreground" />
                </div>
              </div>

              {/* Error Message */}
              <div className="mb-8 space-y-4">
                <h1 className="text-4xl font-bold tracking-tight text-foreground">
                  Page Not Found
                </h1>
                <p className="text-xl text-muted-foreground">
                  The page you are looking for doesnt exist or has been moved.
                </p>
                <p className="text-sm text-muted-foreground">
                  Please check the URL or use the navigation below to find what
                  you&apos;re looking for.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Button asChild size="lg">
                  <Link href="/en">
                    <Home className="mr-2 h-4 w-4" />
                    Go Home
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="javascript:history.back()">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Go Back
                  </Link>
                </Button>
              </div>

              {/* Quick Links */}
              <div className="mt-12">
                <h3 className="mb-6 text-lg font-semibold">Popular Pages</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Button
                    asChild
                    variant="ghost"
                    className="h-auto flex-col p-4"
                  >
                    <Link href="/en/tournaments">
                      <Trophy className="mb-2 h-6 w-6" />
                      <span className="text-sm">Tournaments</span>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    className="h-auto flex-col p-4"
                  >
                    <Link href="/en/teams">
                      <Users className="mb-2 h-6 w-6" />
                      <span className="text-sm">Teams</span>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    className="h-auto flex-col p-4"
                  >
                    <Link href="/en/venues">
                      <MapPin className="mb-2 h-6 w-6" />
                      <span className="text-sm">Venues</span>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    className="h-auto flex-col p-4"
                  >
                    <Link href="/en/results">
                      <Search className="mb-2 h-6 w-6" />
                      <span className="text-sm">Live</span>
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Language Selection */}
              <div className="mt-8">
                <h3 className="mb-4 text-lg font-semibold">Choose Language</h3>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/en">English</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/fi">Suomi</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/sv">Svenska</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/no">Norsk</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/da">Dansk</Link>
                  </Button>
                </div>
              </div>

              {/* Contact Support */}
              <div className="mt-8 rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">
                  Need help?{' '}
                  <Link
                    href="/en/contact"
                    className="font-medium text-primary hover:underline"
                  >
                    Contact Support
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
