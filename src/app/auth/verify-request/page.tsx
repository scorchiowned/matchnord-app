import { redirect } from 'next/navigation';

export default function AuthVerifyRequestPage() {
  // Redirect to the localized verify-request page
  redirect('/fi/auth/verify-request');
}
