"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { ArrowRight, Download, Smartphone } from "lucide-react";

export default function CTASection() {
  const t = useTranslations();

  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 to-green-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Follow Your
            <br />
            Favorite Tournaments?
          </h2>

          <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
            Join thousands of users who are already following tournaments across
            the Nordic region. Start exploring today!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link href="/tournaments">
              <Button
                size="lg"
                className="text-lg px-8 py-4 h-auto bg-white text-blue-600 hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Start Exploring
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>

            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8 py-4 h-auto border-2 border-white text-white hover:bg-white hover:text-blue-600 transition-all duration-300"
            >
              <Download className="mr-2 w-5 h-5" />
              Download App
            </Button>
          </div>

          {/* Mobile Preview */}
          <div className="relative max-w-sm mx-auto">
            <div className="bg-white rounded-3xl p-2 shadow-2xl">
              <div className="bg-gray-900 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-2 bg-gray-700 rounded w-3/4"></div>
                  <div className="h-2 bg-gray-700 rounded w-1/2"></div>
                  <div className="h-2 bg-gray-700 rounded w-2/3"></div>
                </div>
                <div className="mt-4 flex items-center justify-center">
                  <Smartphone className="w-8 h-8 text-blue-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
