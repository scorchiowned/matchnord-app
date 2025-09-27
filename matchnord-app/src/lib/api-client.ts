// API Client for consuming matchnord-extranet APIs

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      throw new ApiError(
        `API request failed: ${response.statusText}`,
        response.status,
        response.statusText
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Network or other errors
    throw new ApiError(
      `Network error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      0,
      "Network Error"
    );
  }
}

// Tournament API
export const tournamentApi = {
  // Get all tournaments
  getAll: async (params?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set("status", params.status);
    if (params?.search) searchParams.set("search", params.search);
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.offset) searchParams.set("offset", params.offset.toString());

    const queryString = searchParams.toString();
    const endpoint = `/api/tournaments/simple${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await fetchApi<{
      success: boolean;
      tournaments: Tournament[];
      count: number;
    }>(endpoint);

    return response.tournaments;
  },

  // Get single tournament
  getById: async (id: string) => {
    return fetchApi<Tournament>(`/api/v1/tournaments/${id}`);
  },

  // Get tournament divisions
  getDivisions: async (id: string) => {
    return fetchApi<Division[]>(`/api/v1/tournaments/${id}/divisions`);
  },

  // Get tournament groups
  getGroups: async (id: string) => {
    return fetchApi<Group[]>(`/api/v1/tournaments/${id}/groups`);
  },

  // Get tournament matches
  getMatches: async (
    id: string,
    params?: {
      divisionId?: string;
      groupId?: string;
      status?: string;
    }
  ) => {
    const searchParams = new URLSearchParams();
    if (params?.divisionId) searchParams.set("divisionId", params.divisionId);
    if (params?.groupId) searchParams.set("groupId", params.groupId);
    if (params?.status) searchParams.set("status", params.status);

    const queryString = searchParams.toString();
    const endpoint = `/api/v1/tournaments/${id}/matches${
      queryString ? `?${queryString}` : ""
    }`;

    return fetchApi<Match[]>(endpoint);
  },

  // Get tournament teams
  getTeams: async (id: string) => {
    return fetchApi<Team[]>(`/api/v1/tournaments/${id}/teams`);
  },

  // Get tournament venues
  getVenues: async (id: string) => {
    return fetchApi<Venue[]>(`/api/v1/tournaments/${id}/venues`);
  },

  // Get public tournament info
  getPublic: async (id: string) => {
    return fetchApi<Tournament>(`/api/v1/tournaments/${id}/public`);
  },
};

// Match API
export const matchApi = {
  // Get single match
  getById: async (id: string) => {
    return fetchApi<Match>(`/api/v1/matches/${id}`);
  },

  // Get live matches
  getLive: async () => {
    return fetchApi<Match[]>(`/api/v1/matches/live`);
  },

  // Get match events
  getEvents: async (id: string) => {
    return fetchApi<MatchEvent[]>(`/api/v1/matches/${id}/events`);
  },
};

// Division API
export const divisionApi = {
  // Get division details
  getById: async (id: string) => {
    return fetchApi<Division>(`/api/v1/divisions/${id}`);
  },

  // Get division groups
  getGroups: async (id: string) => {
    return fetchApi<Group[]>(`/api/v1/divisions/${id}/groups`);
  },

  // Get division standings
  getStandings: async (id: string) => {
    return fetchApi<Standing[]>(`/api/v1/divisions/${id}/standings`);
  },
};

// Group API
export const groupApi = {
  // Get group details
  getById: async (id: string) => {
    return fetchApi<Group>(`/api/v1/groups/${id}`);
  },

  // Get group teams
  getTeams: async (id: string) => {
    return fetchApi<Team[]>(`/api/v1/groups/${id}/teams`);
  },

  // Get group standings
  getStandings: async (id: string) => {
    return fetchApi<Standing[]>(`/api/v1/groups/${id}/standings`);
  },
};

// Team API
export const teamApi = {
  // Get team details
  getById: async (id: string) => {
    return fetchApi<Team>(`/api/v1/teams/${id}`);
  },

  // Get team players
  getPlayers: async (id: string) => {
    return fetchApi<Player[]>(`/api/v1/teams/${id}/players`);
  },
};

// Venue API
export const venueApi = {
  // Get venue details
  getById: async (id: string) => {
    return fetchApi<Venue>(`/api/v1/venues/${id}`);
  },

  // Get venue pitches
  getPitches: async (id: string) => {
    return fetchApi<Pitch[]>(`/api/v1/venues/${id}/pitches`);
  },
};

// Export all APIs
export const api = {
  tournaments: tournamentApi,
  matches: matchApi,
  divisions: divisionApi,
  groups: groupApi,
  teams: teamApi,
  venues: venueApi,
};

export { ApiError };

