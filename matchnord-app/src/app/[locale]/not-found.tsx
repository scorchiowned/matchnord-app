"use client";

import Link from "next/link";
import { Button } from "../../components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import { useTranslations } from 'next-intl';

export default function NotFound() {
  const t = useTranslations();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            {t('pages.notFound.title')}
          </h2>
          <p className="text-gray-600">
            {t('pages.notFound.description')}
          </p>
        </div>

        <div className="space-y-4">
          <Link href="/">
            <Button className="w-full">
              <Home className="w-4 h-4 mr-2" />
              {t('pages.notFound.goHome')}
            </Button>
          </Link>

          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('pages.notFound.goBack')}
          </Button>
        </div>
      </div>
    </div>
  );
}

