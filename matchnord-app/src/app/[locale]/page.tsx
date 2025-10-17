import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export default function HomePage() {
  const t = useTranslations();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {t('common.appName')}
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          {t('tournament.discoverSubtitle')}
        </p>
        <Link href="/tournaments">
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
            {t('navigation.tournaments')}
          </button>
        </Link>
      </div>
    </div>
  );
}
