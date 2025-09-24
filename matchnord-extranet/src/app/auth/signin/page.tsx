import { redirect } from 'next/navigation';

export default function AuthSignInPage() {
  // Redirect to the localized signin page
  redirect('/fi/auth/signin');
}
