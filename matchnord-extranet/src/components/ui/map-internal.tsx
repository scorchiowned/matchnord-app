'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapInternalProps {
  center: [number, number];
  zoom?: number;
  height?: string;
  children?: React.ReactNode;
}

// Component to update map center when props change
function MapUpdater({
  center,
  zoom,
}: {
  center: [number, number];
  zoom?: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (map) {
      map.setView(center, zoom);
    }
  }, [map, center, zoom]);

  return null;
}

export default function MapInternal({
  center,
  zoom = 13,
  height = '300px',
  children,
}: MapInternalProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div
        className="flex items-center justify-center rounded-lg bg-gray-100"
        style={{ height }}
      >
        <div className="text-gray-500">Loading map...</div>
      </div>
    );
  }

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      <MapUpdater center={center} zoom={zoom} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {children}
    </MapContainer>
  );
}

// Draggable marker component for admin forms
interface DraggableMarkerProps {
  position: [number, number];
  onPositionChange: (lat: number, lng: number) => void;
  popup?: string;
}

export function DraggableMarker({
  position,
  onPositionChange,
  popup,
}: DraggableMarkerProps) {
  const [markerPosition, setMarkerPosition] =
    useState<[number, number]>(position);

  // Update marker position when prop changes
  useEffect(() => {
    setMarkerPosition(position);
  }, [position]);

  const eventHandlers = {
    dragend: (e: any) => {
      const marker = e.target;
      const newPosition = marker.getLatLng();
      setMarkerPosition([newPosition.lat, newPosition.lng]);
      onPositionChange(newPosition.lat, newPosition.lng);
    },
  };

  return (
    <Marker
      key={`marker-${position[0]}-${position[1]}`}
      position={markerPosition}
      draggable={true}
      eventHandlers={eventHandlers}
    >
      {popup && <Popup>{popup}</Popup>}
    </Marker>
  );
}

// Static marker component for public display
interface StaticMarkerProps {
  position: [number, number];
  popup?: string;
}

export function StaticMarker({ position, popup }: StaticMarkerProps) {
  return <Marker position={position}>{popup && <Popup>{popup}</Popup>}</Marker>;
}
