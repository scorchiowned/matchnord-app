import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tournament Management System',
  description: 'Modern tournament management platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
