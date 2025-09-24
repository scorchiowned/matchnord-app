import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

// Get division details
export function useDivision(id: string) {
  return useQuery({
    queryKey: ["division", id],
    queryFn: () => api.divisions.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get division groups
export function useDivisionGroups(divisionId: string) {
  return useQuery({
    queryKey: ["division", divisionId, "groups"],
    queryFn: () => api.divisions.getGroups(divisionId),
    enabled: !!divisionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get division standings
export function useDivisionStandings(divisionId: string) {
  return useQuery({
    queryKey: ["division", divisionId, "standings"],
    queryFn: () => api.divisions.getStandings(divisionId),
    enabled: !!divisionId,
    staleTime: 30 * 1000, // 30 seconds (standings change with match results)
  });
}

