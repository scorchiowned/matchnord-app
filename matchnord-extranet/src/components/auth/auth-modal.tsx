'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trophy, LogIn, UserPlus, X, ArrowLeft } from 'lucide-react';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type AuthMode = 'select' | 'signin' | 'signup';

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('select');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'signin') {
      // Handle sign in
      console.log('Signing in:', {
        email: formData.email,
        password: formData.password,
      });
      // TODO: Implement actual sign in logic
    } else if (mode === 'signup') {
      // Handle sign up
      if (formData.password !== formData.confirmPassword) {
        alert('Passwords do not match');
        return;
      }
      console.log('Signing up:', {
        email: formData.email,
        password: formData.password,
        name: formData.name,
      });
      // TODO: Implement actual sign up logic
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      name: '',
      confirmPassword: '',
    });
  };

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    resetForm();
  };

  const handleClose = () => {
    setMode('select');
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* Mode Selection Screen */}
        {mode === 'select' && (
          <>
            <DialogHeader className="text-center">
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Sign In to Create Tournaments
              </DialogTitle>
              <DialogDescription className="mt-2 text-base text-gray-600">
                You need to be signed in to create and manage tournaments. Only
                team managers can access the tournament creation wizard.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Benefits Section */}
              <div className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
                <h4 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
                  <Trophy className="h-5 w-5 text-blue-600" />
                  What you&apos;ll get:
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    <span>Create and manage tournaments</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    <span>Access tournament creation wizard</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    <span>Manage team registrations</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    <span>View analytics and reports</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={() => handleModeChange('signin')}
                  className="w-full bg-blue-600 py-3 text-base font-medium text-white hover:bg-blue-700"
                >
                  <LogIn className="mr-2 h-5 w-5" />
                  Sign In to Continue
                </Button>
                <Button
                  onClick={() => handleModeChange('signup')}
                  variant="outline"
                  className="w-full py-3 text-base font-medium"
                >
                  <UserPlus className="mr-2 h-5 w-5" />
                  Create New Account
                </Button>
              </div>

              {/* Dismiss */}
              <div className="pt-2 text-center">
                <Button
                  variant="ghost"
                  onClick={handleClose}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Continue browsing
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Sign In Form */}
        {mode === 'signin' && (
          <>
            <DialogHeader className="text-center">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleModeChange('select')}
                  className="h-8 w-8 p-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <DialogTitle className="text-xl font-bold text-gray-900">
                  Sign In
                </DialogTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <DialogDescription className="mt-2 text-sm text-gray-600">
                Enter your credentials to access your account
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange('password', e.target.value)
                  }
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            </form>

            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => handleModeChange('signup')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Don&apos;t have an account? Sign up
              </Button>
            </div>
          </>
        )}

        {/* Sign Up Form */}
        {mode === 'signup' && (
          <>
            <DialogHeader className="text-center">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleModeChange('select')}
                  className="h-8 w-8 p-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <DialogTitle className="text-xl font-bold text-gray-900">
                  Create Account
                </DialogTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <DialogDescription className="mt-2 text-sm text-gray-600">
                Create a new account to start managing tournaments
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange('password', e.target.value)
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange('confirmPassword', e.target.value)
                  }
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                <UserPlus className="mr-2 h-4 w-4" />
                Create Account
              </Button>
            </form>

            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => handleModeChange('signin')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Already have an account? Sign in
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
