// API Client for consuming matchnord-extranet APIs

// Default to localhost:3001 if NEXT_PUBLIC_API_URL is not set
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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
    country?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set("status", params.status);
    if (params?.search) searchParams.set("search", params.search);
    if (params?.country) searchParams.set("country", params.country);
    if (params?.startDate) searchParams.set("startDate", params.startDate);
    if (params?.endDate) searchParams.set("endDate", params.endDate);
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
    return fetchApi<Tournament>(`/api/v1/tournaments/${id}/public`);
  },

  // Get tournament divisions
  getDivisions: async (id: string) => {
    return fetchApi<Division[]>(`/api/v1/tournaments/${id}/public/divisions`);
  },

  // Get tournament groups
  getGroups: async (id: string) => {
    return fetchApi<Group[]>(`/api/v1/tournaments/${id}/public/groups`);
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
    const endpoint = `/api/v1/tournaments/${id}/public/matches${
      queryString ? `?${queryString}` : ""
    }`;

    return fetchApi<Match[]>(endpoint);
  },

  // Get tournament teams
  getTeams: async (id: string) => {
    return fetchApi<Team[]>(`/api/v1/tournaments/${id}/public/teams`);
  },

  // Get tournament venues
  getVenues: async (id: string) => {
    return fetchApi<Venue[]>(`/api/v1/tournaments/${id}/public/venues`);
  },

  // Get public tournament info
  getPublic: async (id: string) => {
    return fetchApi<Tournament>(`/api/v1/tournaments/${id}/public`);
  },

  // Get tournament registration information
  getRegistrationInfo: async (id: string) => {
    return fetchApi<{
      success: boolean;
      tournament: {
        id: string;
        name: string;
        description?: string;
        registrationInfo?: string;
        registrationDeadline?: string;
        autoAcceptTeams: boolean;
        allowWaitlist: boolean;
        startDate: string;
        endDate: string;
        location: {
          city?: string;
          country: {
            name: string;
            code: string;
          };
        };
        divisions: Array<{
          id: string;
          name: string;
          description?: string;
          birthYear?: number;
          format?: string;
          level: string;
          minTeams: number;
          maxTeams: number;
          currentTeams: number;
          registrationFee?: {
            id: string;
            name: string;
            description?: string;
            amount: number;
            currency: string;
          };
          availableSpots: number;
          isFull: boolean;
          isWaitlistAvailable: boolean;
        }>;
        isRegistrationOpen: boolean;
        isLocked: boolean;
        lockedAt?: string;
        lockedBy?: string;
      };
    }>(`/api/v1/tournaments/${id}/registration-info`);
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

// Registration API
export const registrationApi = {
  // Submit team registration
  submit: async (data: {
    tournamentId: string;
    divisionId: string;
    teamName: string;
    teamLogo?: string;
    club: string;
    clubId?: string;
    clubSelectionType?: "existing" | "new";
    city: string;
    country: string;
    level?: string;
    contactFirstName: string;
    contactLastName: string;
    contactEmail: string;
    contactPhone: string;
    contactAddress: string;
    contactPostalCode: string;
    contactCity: string;
    billingName?: string;
    billingAddress?: string;
    billingPostalCode?: string;
    billingCity?: string;
    billingEmail?: string;
    acceptTerms: boolean;
    acceptPrivacy: boolean;
  }) => {
    return fetchApi<{
      success: boolean;
      registration: {
        id: string;
        teamName: string;
        division: string;
        tournament: string;
        status: string;
        amount: number;
        paymentMethod?: string;
        submittedAt: string;
      };
    }>("/api/v1/registrations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
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
  registrations: registrationApi,
};

export { ApiError };
