"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Building2, Loader2, Search } from "lucide-react";
import Image from "next/image";
import { Input } from "@/components/ui/input";

interface Club {
  id: string;
  name: string;
  shortName?: string;
  logo?: string;
  city?: string;
  country: {
    id: string;
    name: string;
    code: string;
  };
}

interface ClubSelectorProps {
  selectedClubId: string;
  onClubChange: (clubId: string, clubName: string) => void;
  onNewClub: () => void;
  country?: string;
}

export function ClubSelector({
  selectedClubId,
  onClubChange,
  onNewClub,
  country,
}: ClubSelectorProps) {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClubCache, setSelectedClubCache] = useState<Club | null>(null);

  // Fetch clubs from API with search parameters
  const searchClubs = useCallback(async (search: string = "", preserveSelected: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (country) params.append("countryId", country);
      if (search) {
        params.append("search", search);
        params.append("limit", "100"); // More results when searching
      } else {
        params.append("limit", "50"); // Initial load with fewer results
      }

      const response = await fetch(`/api/v1/clubs?${params}`);
      if (response.ok) {
        const data = await response.json();
        let clubsList = data.clubs || [];
        
        // If we have a selected club and it's not in the results, add it to the top
        if (preserveSelected && selectedClubCache && !clubsList.find((c: Club) => c.id === selectedClubCache.id)) {
          clubsList = [selectedClubCache, ...clubsList];
        }
        
        setClubs(clubsList);
      } else {
        setError("Failed to load clubs");
      }
    } catch (error) {
      console.error("Error loading clubs:", error);
      setError("Failed to load clubs");
    } finally {
      setLoading(false);
    }
  }, [country, selectedClubCache]);

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      searchClubs(searchTerm, true); // Preserve selected club
    }, 300); // 300ms debounce delay

    return () => clearTimeout(timer);
  }, [searchTerm, searchClubs]);

  // Initial load when country changes
  useEffect(() => {
    searchClubs("", false);
    setSearchTerm(""); // Reset search when country changes
  }, [country, searchClubs]);

  // Fetch selected club if we have an ID but no cached club
  useEffect(() => {
    const fetchSelectedClub = async () => {
      if (selectedClubId && !selectedClubCache) {
        try {
          const response = await fetch(`/api/v1/clubs/${selectedClubId}`);
          if (response.ok) {
            const club = await response.json();
            setSelectedClubCache(club);
          }
        } catch (error) {
          console.error("Error fetching selected club:", error);
        }
      }
    };
    fetchSelectedClub();
  }, [selectedClubId, selectedClubCache]);

  const selectedClub = clubs.find((club) => club.id === selectedClubId) || selectedClubCache;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <Select
            value={selectedClubId}
            onValueChange={(value) => {
              const club = clubs.find((c) => c.id === value);
              if (club) {
                setSelectedClubCache(club); // Cache the selected club
                onClubChange(club.id, club.name);
              }
              setSearchTerm(""); // Clear search after selection
            }}
            onOpenChange={(open) => {
              if (!open) {
                setSearchTerm(""); // Clear search when dropdown closes
              }
            }}
            disabled={loading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a club...">
                {selectedClub && (
                  <div className="flex items-center gap-2">
                    {selectedClub.logo ? (
                      <Image
                        src={selectedClub.logo}
                        alt={`${selectedClub.name} logo`}
                        width={20}
                        height={20}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <Building2 className="h-4 w-4 text-gray-500" />
                    )}
                    <span>{selectedClub.name}</span>
                    {selectedClub.shortName && (
                      <span className="text-xs text-gray-500">
                        ({selectedClub.shortName})
                      </span>
                    )}
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-[400px]">
              {/* Search Input */}
              <div className="sticky top-0 z-10 bg-white p-2 border-b">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search clubs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                    onKeyDown={(e) => {
                      // Prevent the select from closing when typing
                      e.stopPropagation();
                    }}
                  />
                </div>
              </div>

              {/* Scrollable List */}
              <div className="overflow-y-auto max-h-[300px]">
                {loading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span className="text-sm text-gray-600">
                      {searchTerm ? "Searching clubs..." : "Loading clubs..."}
                    </span>
                  </div>
                ) : clubs.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    {searchTerm ? "No clubs match your search" : "No clubs found"}
                  </div>
                ) : (
                  clubs.map((club) => (
                    <SelectItem key={club.id} value={club.id}>
                      <div className="flex items-center gap-2">
                        {club.logo ? (
                          <Image
                            src={club.logo}
                            alt={`${club.name} logo`}
                            width={20}
                            height={20}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <Building2 className="h-4 w-4 text-gray-500" />
                        )}
                        <div className="flex flex-col">
                          <span className="font-medium">{club.name}</span>
                          <span className="text-xs text-gray-500">
                            {club.city && `${club.city}, `}
                            {club.country.name}
                            {club.shortName && ` (${club.shortName})`}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))
                )}
              </div>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={onNewClub} type="button">
          <Plus className="h-4 w-4 mr-2" />
          Add New
        </Button>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
}
