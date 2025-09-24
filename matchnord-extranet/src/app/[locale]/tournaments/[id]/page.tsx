import { redirect } from 'next/navigation';

export default async function TournamentPage({
  params,
}: {
  params: { id: string; locale: string };
}) {
  // Redirect to the new public tournament view
  redirect(`/${params.locale}/tournaments/${params.id}/public`);
}
