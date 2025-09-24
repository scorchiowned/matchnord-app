"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, Globe } from "lucide-react";
import { useState } from "react";
// import LanguageSwitcher from "./language-switcher";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigation = [
    { name: "Home", href: "/fi" },
    { name: "Tournaments", href: "/fi/tournaments" },
    { name: "Live", href: "/fi/live", isLive: true },
    { name: "Results", href: "/fi/results" },
    { name: "About", href: "/fi/about" },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/fi" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="text-xl font-bold text-gray-900">MatchNord</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`font-medium transition-colors flex items-center ${
                  item.isLive
                    ? "text-red-600 hover:text-red-700"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {item.isLive && (
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                )}
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* <LanguageSwitcher /> */}

            <Link href="/fi/tournaments">
              <Button className="hidden sm:inline-flex">Tournaments</Button>
            </Link>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`font-medium transition-colors px-4 py-2 flex items-center ${
                    item.isLive
                      ? "text-red-600 hover:text-red-700"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.isLive && (
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                  )}
                  {item.name}
                </Link>
              ))}
              <div className="px-4 pt-4 border-t border-gray-200">
                <Link href="/fi/tournaments">
                  <Button className="w-full">Tournaments</Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
