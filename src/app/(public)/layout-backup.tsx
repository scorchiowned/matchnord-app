import { MainNavigation } from '@/components/navigation/main-navigation';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <MainNavigation />
      <main className="container mx-auto py-6">{children}</main>
    </div>
  );
}
