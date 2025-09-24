import { redirect } from 'next/navigation';

export default function AuthErrorPage() {
  // Redirect to the localized error page
  redirect('/fi/auth/error');
}
