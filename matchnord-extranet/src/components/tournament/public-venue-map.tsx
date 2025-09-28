'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Map, StaticMarker } from '@/components/ui/map';
import { MapPin, ExternalLink, Smartphone } from 'lucide-react';

interface PublicVenueMapProps {
  venue: {
    name: string;
    streetName?: string;
    postalCode?: string;
    city?: string;
    country?: {
      name: string;
    };
    xCoordinate?: number;
    yCoordinate?: number;
  };
  className?: string;
}

export function PublicVenueMap({ venue, className = '' }: PublicVenueMapProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    setIsMobile(
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    );
  }, []);

  // Check if we have valid coordinates
  const hasCoordinates = venue.xCoordinate && venue.yCoordinate;

  if (!hasCoordinates) {
    return (
      <div
        className={`rounded-lg border bg-gray-50 p-6 text-center ${className}`}
      >
        <MapPin className="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <h3 className="mb-2 text-lg font-medium text-gray-900">
          Location Information
        </h3>
        <p className="mb-4 text-gray-600">
          {venue.name}
          {venue.streetName && (
            <>
              <br />
              {venue.streetName}
            </>
          )}
          {venue.postalCode && venue.city && (
            <>
              <br />
              {venue.postalCode} {venue.city}
            </>
          )}
          {venue.country && (
            <>
              <br />
              {venue.country.name}
            </>
          )}
        </p>
        <p className="text-sm text-gray-500">Map location not available</p>
      </div>
    );
  }

  const coordinates: [number, number] = [
    venue.yCoordinate!,
    venue.xCoordinate!,
  ];

  const getAddressString = () => {
    const parts = [
      venue.streetName,
      venue.postalCode,
      venue.city,
      venue.country?.name,
    ].filter(Boolean);
    return parts.join(', ');
  };

  const getOSMUrl = () => {
    return `https://www.openstreetmap.org/?mlat=${coordinates[0]}&mlon=${coordinates[1]}&zoom=15`;
  };

  const getGeoUrl = () => {
    return `geo:${coordinates[0]},${coordinates[1]}`;
  };

  const handleOpenInMaps = () => {
    if (isMobile) {
      // For mobile, try to open in default maps app
      window.location.href = getGeoUrl();
    } else {
      // For desktop, open OSM in new tab
      window.open(getOSMUrl(), '_blank');
    }
  };

  if (mapError) {
    return (
      <div
        className={`rounded-lg border bg-gray-50 p-6 text-center ${className}`}
      >
        <MapPin className="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <h3 className="mb-2 text-lg font-medium text-gray-900">{venue.name}</h3>
        <p className="mb-4 text-gray-600">{getAddressString()}</p>
        <Button
          onClick={handleOpenInMaps}
          variant="outline"
          className="flex items-center gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          Open in {isMobile ? 'Maps App' : 'OpenStreetMap'}
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Map */}
      <div className="overflow-hidden rounded-lg border">
        <Map center={coordinates} zoom={15} height="300px" className="w-full">
          <StaticMarker
            position={coordinates}
            popup={
              <div className="p-2">
                <h4 className="text-sm font-medium">{venue.name}</h4>
                <p className="mt-1 text-xs text-gray-600">
                  {getAddressString()}
                </p>
              </div>
            }
          />
        </Map>
      </div>

      {/* Address and Actions */}
      <div className="space-y-3">
        <div>
          <h3 className="font-medium text-gray-900">{venue.name}</h3>
          <p className="text-sm text-gray-600">{getAddressString()}</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={handleOpenInMaps}
            variant="outline"
            size="sm"
            className="flex flex-1 items-center gap-2"
          >
            {isMobile ? (
              <>
                <Smartphone className="h-4 w-4" />
                Open in Maps App
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4" />
                Open in OpenStreetMap
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
