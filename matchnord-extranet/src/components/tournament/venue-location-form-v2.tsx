'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Map, DraggableMarker } from '@/components/ui/map';
import { MapPin, Search, Save, X } from 'lucide-react';

interface VenueLocationFormV2Props {
  initialData?: {
    name?: string;
    address?: string;
    xCoordinate?: number;
    yCoordinate?: number;
  };
  onSave: (data: {
    name: string;
    address?: string;
    xCoordinate?: number;
    yCoordinate?: number;
  }) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  place_id: string;
}

export function VenueLocationFormV2({
  initialData,
  onSave,
  onCancel,
  isLoading = false,
}: VenueLocationFormV2Props) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    address: initialData?.address || '',
  });

  const [coordinates, setCoordinates] = useState<[number, number]>([
    initialData?.yCoordinate || 60.1699, // Helsinki default
    initialData?.xCoordinate || 24.9384,
  ]);

  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<AddressSuggestion | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (field === 'address' && value.length > 2) {
      // Debounce the geocoding request
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        searchAddresses(value);
      }, 300);
    } else if (field === 'address' && value.length <= 2) {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const searchAddresses = async (query: string) => {
    if (!query.trim()) return;

    setIsGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&countrycodes=fi,se,no,dk`
      );

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Address search failed:', error);
    } finally {
      setIsGeocoding(false);
    }
  };

  const selectSuggestion = (suggestion: AddressSuggestion) => {
    setFormData((prev) => ({ ...prev, address: suggestion.display_name }));
    setCoordinates([parseFloat(suggestion.lat), parseFloat(suggestion.lon)]);
    setSelectedSuggestion(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleMarkerDrag = (lat: number, lng: number) => {
    setCoordinates([lat, lng]);
    setSelectedSuggestion(null); // Clear selected suggestion when manually moving marker
  };

  const handleSave = () => {
    onSave({
      name: formData.name,
      address: formData.address,
      xCoordinate: coordinates[1], // longitude
      yCoordinate: coordinates[0], // latitude
    });
  };

  const getAddressString = () => {
    return formData.address || 'No address specified';
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Venue Location
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Venue Name */}
        <div className="space-y-2">
          <Label htmlFor="venue-name">Venue Name *</Label>
          <Input
            id="venue-name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter venue name"
            required
          />
        </div>

        {/* Address with Autocomplete */}
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <div className="relative" ref={inputRef}>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Start typing an address..."
              className="pr-8"
            />
            {isGeocoding && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
              </div>
            )}

            {/* Address Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow-lg">
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.place_id}
                    className="cursor-pointer px-4 py-2 hover:bg-gray-100"
                    onClick={() => selectSuggestion(suggestion)}
                  >
                    <div className="text-sm font-medium">
                      {suggestion.display_name.split(',')[0]}
                    </div>
                    <div className="text-xs text-gray-500">
                      {suggestion.display_name
                        .split(',')
                        .slice(1)
                        .join(',')
                        .trim()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Start typing to search for addresses in Nordic countries
          </p>
        </div>

        {/* Map */}
        <div className="space-y-2">
          <Label>Location on Map</Label>
          <div className="overflow-hidden rounded-lg border">
            <Map
              center={coordinates}
              zoom={15}
              height="400px"
              className="w-full"
            >
              <DraggableMarker
                key={`${coordinates[0]}-${coordinates[1]}`}
                position={coordinates}
                onPositionChange={handleMarkerDrag}
                popup={getAddressString()}
              />
            </Map>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Coordinates: {coordinates[0].toFixed(6)},{' '}
              {coordinates[1].toFixed(6)}
            </span>
            {selectedSuggestion && (
              <span className="text-green-600">
                ✓ Address selected from search
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Drag the marker to set the exact location
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            type="button"
            onClick={handleSave}
            disabled={isLoading || !formData.name}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isLoading ? 'Saving...' : 'Save Location'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
