import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Tournament, TournamentFilters } from "@/types/api";

// Get all tournaments
export function useTournaments(filters?: TournamentFilters) {
  return useQuery({
    queryKey: ["tournaments", filters],
    queryFn: () => api.tournaments.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get single tournament
export function useTournament(id: string) {
  return useQuery({
    queryKey: ["tournament", id],
    queryFn: () => api.tournaments.getById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Get public tournament info
export function usePublicTournament(id: string) {
  return useQuery({
    queryKey: ["tournament", "public", id],
    queryFn: () => api.tournaments.getPublic(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Get tournament divisions
export function useTournamentDivisions(tournamentId: string) {
  return useQuery({
    queryKey: ["tournament", tournamentId, "divisions"],
    queryFn: () => api.tournaments.getDivisions(tournamentId),
    enabled: !!tournamentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get tournament groups
export function useTournamentGroups(tournamentId: string) {
  return useQuery({
    queryKey: ["tournament", tournamentId, "groups"],
    queryFn: () => api.tournaments.getGroups(tournamentId),
    enabled: !!tournamentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get tournament matches
export function useTournamentMatches(
  tournamentId: string,
  filters?: {
    divisionId?: string;
    groupId?: string;
    status?: string;
  }
) {
  return useQuery({
    queryKey: ["tournament", tournamentId, "matches", filters],
    queryFn: () => api.tournaments.getMatches(tournamentId, filters),
    enabled: !!tournamentId,
    staleTime: 30 * 1000, // 30 seconds (matches change frequently)
  });
}

// Get single tournament match
export function useTournamentMatch(tournamentId: string, matchId: string) {
  return useQuery({
    queryKey: ["tournament", tournamentId, "match", matchId],
    queryFn: () => api.tournaments.getMatch(tournamentId, matchId),
    enabled: !!tournamentId && !!matchId,
    staleTime: 30 * 1000, // 30 seconds (matches change frequently)
  });
}

// Get tournament teams
export function useTournamentTeams(tournamentId: string) {
  return useQuery({
    queryKey: ["tournament", tournamentId, "teams"],
    queryFn: () => api.tournaments.getTeams(tournamentId),
    enabled: !!tournamentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get tournament venues
export function useTournamentVenues(tournamentId: string) {
  return useQuery({
    queryKey: ["tournament", tournamentId, "venues"],
    queryFn: () => api.tournaments.getVenues(tournamentId),
    enabled: !!tournamentId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Infinite query for tournaments (pagination)
export function useInfiniteTournaments(
  filters?: Omit<TournamentFilters, "limit" | "offset">
) {
  return useInfiniteQuery({
    queryKey: ["tournaments", "infinite", filters],
    queryFn: ({ pageParam = 0 }) =>
      api.tournaments.getAll({
        ...filters,
        limit: 20,
        offset: pageParam * 20,
      }),
    getNextPageParam: (lastPage, allPages) => {
      // If we got less than the limit, we've reached the end
      if (lastPage.length < 20) return undefined;
      return allPages.length;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

