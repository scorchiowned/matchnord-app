// Use relative URLs for same-origin requests (production), or absolute URL if env var is set
// In production, the extranet app calls its own API endpoints on the same server
const getApiBaseUrl = () => {
  // If NEXT_PUBLIC_API_URL is explicitly set, use it (for cross-origin or specific config)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  // Otherwise use relative URLs (same origin) - works in both dev and production
  // This allows the app to call its own API endpoints
  return typeof window !== 'undefined' ? '/api/v1' : 'http://localhost:3001/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

export async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include', // Include cookies for session
    ...options,
  });

  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

export const api = {
  matches: {
    getAll: (params?: Record<string, string>) => {
      const searchParams = new URLSearchParams(params);
      return fetchApi(`/matches?${searchParams.toString()}`);
    },
    getById: (id: string) => fetchApi(`/matches/${id}`),
    updateScore: (id: string, homeScore: number, awayScore: number) =>
      fetchApi(`/matches/${id}/score`, {
        method: 'PUT',
        body: JSON.stringify({ homeScore, awayScore }),
      }),
    updateStatus: (id: string, status: string) =>
      fetchApi(`/matches/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),
    getEvents: (id: string) => fetchApi(`/matches/${id}/events`),
    createEvent: (id: string, data: any) =>
      fetchApi(`/matches/${id}/events`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateEvent: (matchId: string, eventId: string, data: any) =>
      fetchApi(`/matches/${matchId}/events/${eventId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deleteEvent: (matchId: string, eventId: string) =>
      fetchApi(`/matches/${matchId}/events/${eventId}`, {
        method: 'DELETE',
      }),
  },
  tournaments: {
    getAll: (params?: Record<string, string>) => {
      const searchParams = new URLSearchParams(params);
      return fetchApi(`/tournaments?${searchParams.toString()}`);
    },
    getById: (id: string) => fetchApi(`/tournaments/${id}`),
    getPublic: (id: string) => fetchApi(`/tournaments/${id}/public`),
    getManage: (id: string) => fetchApi(`/tournaments/${id}/manage`),
    getPermissions: (id: string) => fetchApi(`/tournaments/${id}/permissions`),
    update: (id: string, data: any) =>
      fetchApi(`/tournaments/${id}/manage`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    action: (id: string, action: string, data?: any) =>
      fetchApi(`/tournaments/${id}/manage`, {
        method: 'POST',
        body: JSON.stringify({ action, data }),
      }),
  },
  countries: {
    getAll: (params?: Record<string, string>) => {
      const searchParams = new URLSearchParams(params);
      return fetchApi(`/countries?${searchParams.toString()}`);
    },
  },
  venues: {
    getAll: (params?: Record<string, string>) => {
      const searchParams = new URLSearchParams(params);
      return fetchApi(`/venues?${searchParams.toString()}`);
    },
  },
  ageGroups: {
    getAll: () => fetchApi('/age-groups'),
  },
  teams: {
    getAll: (params?: Record<string, string>) => {
      const searchParams = new URLSearchParams(params);
      return fetchApi(`/teams?${searchParams.toString()}`);
    },
    getById: (id: string) => fetchApi(`/teams/${id}`),
  },
};
