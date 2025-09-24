import { LandingPage } from '@/components/landing/landing-page';
import { UserDashboard } from '@/components/dashboard/user-dashboard';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    return <UserDashboard userRole={session.user.role} />;
  }

  return <LandingPage />;
}
