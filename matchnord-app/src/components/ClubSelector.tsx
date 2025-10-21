"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Building2, Loader2 } from "lucide-react";
import Image from "next/image";

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

  const searchClubs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (country) params.append("countryId", country);
      params.append("limit", "50");

      const response = await fetch(`/api/v1/clubs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setClubs(data.clubs || []);
      } else {
        setError("Failed to load clubs");
      }
    } catch (error) {
      console.error("Error loading clubs:", error);
      setError("Failed to load clubs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchClubs();
  }, [country]);

  const selectedClub = clubs.find((club) => club.id === selectedClubId);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <Select
            value={selectedClubId}
            onValueChange={(value) => {
              const club = clubs.find((c) => c.id === value);
              if (club) {
                onClubChange(club.id, club.name);
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
            <SelectContent>
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span className="text-sm text-gray-600">
                    Loading clubs...
                  </span>
                </div>
              ) : clubs.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No clubs found
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
