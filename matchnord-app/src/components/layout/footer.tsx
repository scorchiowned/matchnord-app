"use client";

import Link from "next/link";
import { Facebook, Twitter, Instagram, Mail } from "lucide-react";
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';

export default function Footer() {
  const t = useTranslations();
  const locale = useLocale();

  const footerLinks = {
    product: [
      { name: t('footer.links.tournaments'), href: `/${locale}/tournaments` },
      { name: t('footer.links.liveScores'), href: `/${locale}/live` },
      { name: t('footer.links.results'), href: `/${locale}/results` },
      { name: t('footer.links.mobileApp'), href: `/${locale}/app` },
    ],
    support: [
      { name: t('footer.links.helpCenter'), href: `/${locale}/help` },
      { name: t('footer.links.contactUs'), href: `/${locale}/contact` },
      { name: t('footer.links.apiDocumentation'), href: `/${locale}/api` },
      { name: t('footer.links.status'), href: `/${locale}/status` },
    ],
    company: [
      { name: t('footer.links.aboutUs'), href: `/${locale}/about` },
      { name: t('footer.links.privacyPolicy'), href: `/${locale}/privacy` },
      { name: t('footer.links.termsOfService'), href: `/${locale}/terms` },
      { name: t('footer.links.careers'), href: `/${locale}/careers` },
    ],
  };

  const socialLinks = [
    { name: "Facebook", href: "#", icon: Facebook },
    { name: "Twitter", href: "#", icon: Twitter },
    { name: "Instagram", href: "#", icon: Instagram },
    { name: "Email", href: "mailto:info@matchnord.com", icon: Mail },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href={`/${locale}`} className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="text-xl font-bold">MatchNord</span>
            </Link>
            <p className="text-gray-400 mb-6 max-w-md">
              {t('footer.description')}
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('footer.product')}</h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('footer.support')}</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('footer.company')}</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            {t('footer.copyright')}
          </p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <Link
              href={`/${locale}/privacy`}
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              {t('footer.links.privacy')}
            </Link>
            <Link
              href={`/${locale}/terms`}
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              {t('footer.links.terms')}
            </Link>
            <Link
              href={`/${locale}/cookies`}
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              {t('footer.links.cookies')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

