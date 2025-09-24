import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

// Get group details
export function useGroup(id: string) {
  return useQuery({
    queryKey: ["group", id],
    queryFn: () => api.groups.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get group teams
export function useGroupTeams(groupId: string) {
  return useQuery({
    queryKey: ["group", groupId, "teams"],
    queryFn: () => api.groups.getTeams(groupId),
    enabled: !!groupId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get group standings
export function useGroupStandings(groupId: string) {
  return useQuery({
    queryKey: ["group", groupId, "standings"],
    queryFn: () => api.groups.getStandings(groupId),
    enabled: !!groupId,
    staleTime: 30 * 1000, // 30 seconds (standings change with match results)
  });
}

