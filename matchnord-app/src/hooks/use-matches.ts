import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Match, MatchFilters } from "@/types/api";

// Get single match
export function useMatch(id: string) {
  return useQuery({
    queryKey: ["match", id],
    queryFn: () => api.matches.getById(id),
    enabled: !!id,
    staleTime: 10 * 1000, // 10 seconds (matches change frequently)
  });
}

// Get live matches
export function useLiveMatches() {
  return useQuery({
    queryKey: ["matches", "live"],
    queryFn: () => api.matches.getLive(),
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    staleTime: 10 * 1000, // 10 seconds
  });
}

// Get match events
export function useMatchEvents(matchId: string) {
  return useQuery({
    queryKey: ["match", matchId, "events"],
    queryFn: () => api.matches.getEvents(matchId),
    enabled: !!matchId,
    refetchInterval: 15 * 1000, // Refetch every 15 seconds for live matches
    staleTime: 5 * 1000, // 5 seconds
  });
}

