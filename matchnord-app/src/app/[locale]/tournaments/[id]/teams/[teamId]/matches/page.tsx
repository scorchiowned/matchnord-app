"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function TeamMatchesPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;
  const teamId = params.teamId as string;

  // Redirect to query parameter version
  useEffect(() => {
    router.replace(`/tournaments/${tournamentId}?tab=teams&team=${teamId}`);
  }, [tournamentId, teamId, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
