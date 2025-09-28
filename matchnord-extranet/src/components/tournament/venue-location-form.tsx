'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Map, DraggableMarker, MapUpdater } from '@/components/ui/map';
import { MapPin, Search, Save } from 'lucide-react';

interface VenueLocationFormProps {
  initialData?: {
    name?: string;
    streetName?: string;
    postalCode?: string;
    city?: string;
    countryId?: string;
    xCoordinate?: number;
    yCoordinate?: number;
  };
  onSave: (data: {
    name: string;
    streetName?: string;
    postalCode?: string;
    city?: string;
    countryId?: string;
    xCoordinate?: number;
    yCoordinate?: number;
  }) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function VenueLocationForm({
  initialData,
  onSave,
  onCancel,
  isLoading = false,
}: VenueLocationFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    streetName: initialData?.streetName || '',
    postalCode: initialData?.postalCode || '',
    city: initialData?.city || '',
    countryId: initialData?.countryId || '',
  });

  const [coordinates, setCoordinates] = useState<[number, number]>([
    initialData?.yCoordinate || 60.1699, // Helsinki default
    initialData?.xCoordinate || 24.9384,
  ]);

  const [isGeocoding, setIsGeocoding] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleMarkerDrag = (lat: number, lng: number) => {
    setCoordinates([lat, lng]);
  };

  const geocodeAddress = async () => {
    if (!formData.streetName && !formData.city) {
      return;
    }

    setIsGeocoding(true);
    try {
      // Simple geocoding using Nominatim (OpenStreetMap's geocoding service)
      const address =
        `${formData.streetName || ''} ${formData.postalCode || ''} ${formData.city || ''}`.trim();
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          const { lat, lon } = data[0];
          setCoordinates([parseFloat(lat), parseFloat(lon)]);
        }
      }
    } catch (error) {
      console.error('Geocoding failed:', error);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSave = () => {
    onSave({
      ...formData,
      xCoordinate: coordinates[1], // longitude
      yCoordinate: coordinates[0], // latitude
    });
  };

  const getAddressString = () => {
    const parts = [
      formData.streetName,
      formData.postalCode,
      formData.city,
    ].filter(Boolean);
    return parts.join(', ') || 'No address specified';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Venue Location
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Address Form */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

          <div className="space-y-2">
            <Label htmlFor="street-name">Street Address</Label>
            <Input
              id="street-name"
              value={formData.streetName}
              onChange={(e) => handleInputChange('streetName', e.target.value)}
              placeholder="Enter street address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="postal-code">Postal Code</Label>
            <Input
              id="postal-code"
              value={formData.postalCode}
              onChange={(e) => handleInputChange('postalCode', e.target.value)}
              placeholder="Enter postal code"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder="Enter city"
            />
          </div>
        </div>

        {/* Geocoding Button */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={geocodeAddress}
            disabled={isGeocoding || (!formData.streetName && !formData.city)}
            className="flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            {isGeocoding ? 'Finding...' : 'Find on Map'}
          </Button>
          <span className="text-sm text-muted-foreground">
            Click to center map on address
          </span>
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
              <MapUpdater center={coordinates} zoom={15} />
              <DraggableMarker
                position={coordinates}
                onPositionChange={handleMarkerDrag}
                popup={getAddressString()}
              />
            </Map>
          </div>
          <p className="text-sm text-muted-foreground">
            Drag the marker to set the exact location. Coordinates:{' '}
            {coordinates[0].toFixed(6)}, {coordinates[1].toFixed(6)}
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
