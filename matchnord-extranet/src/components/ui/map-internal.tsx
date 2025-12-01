'use client';

import { useEffect, useState } from 'react';

// Lazy load leaflet components to avoid SSR issues
let MapContainer: any;
let TileLayer: any;
let Marker: any;
let Popup: any;
let useMapHook: any;

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
  useMap,
}: {
  center: [number, number];
  zoom?: number;
  useMap: any;
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
  const [componentsLoaded, setComponentsLoaded] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Only load leaflet on client side
    if (typeof window !== 'undefined') {
      Promise.all([
        import('react-leaflet'),
        import('leaflet'),
        import('leaflet/dist/leaflet.css'),
      ]).then(([reactLeaflet, L, _]) => {
        MapContainer = reactLeaflet.MapContainer;
        TileLayer = reactLeaflet.TileLayer;
        Marker = reactLeaflet.Marker;
        Popup = reactLeaflet.Popup;
        useMapHook = reactLeaflet.useMap;

        // Fix for default markers in react-leaflet
        delete (L.default.Icon.Default.prototype as any)._getIconUrl;
        L.default.Icon.Default.mergeOptions({
          iconRetinaUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        setComponentsLoaded(true);
      });
    }
  }, []);

  if (!isMounted || !componentsLoaded || !MapContainer) {
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
      <MapUpdater center={center} zoom={zoom} useMap={useMapHook} />
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
  const [MarkerComponent, setMarkerComponent] = useState<any>(null);
  const [PopupComponent, setPopupComponent] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('react-leaflet').then((mod) => {
        setMarkerComponent(() => mod.Marker);
        setPopupComponent(() => mod.Popup);
      });
    }
  }, []);

  // Update marker position when prop changes
  useEffect(() => {
    setMarkerPosition(position);
  }, [position]);

  if (!MarkerComponent) {
    return null;
  }

  const eventHandlers = {
    dragend: (e: any) => {
      const marker = e.target;
      const newPosition = marker.getLatLng();
      setMarkerPosition([newPosition.lat, newPosition.lng]);
      onPositionChange(newPosition.lat, newPosition.lng);
    },
  };

  return (
    <MarkerComponent
      key={`marker-${position[0]}-${position[1]}`}
      position={markerPosition}
      draggable={true}
      eventHandlers={eventHandlers}
    >
      {popup && PopupComponent && <PopupComponent>{popup}</PopupComponent>}
    </MarkerComponent>
  );
}

// Static marker component for public display
interface StaticMarkerProps {
  position: [number, number];
  popup?: React.ReactNode;
}

export function StaticMarker({ position, popup }: StaticMarkerProps) {
  const [MarkerComponent, setMarkerComponent] = useState<any>(null);
  const [PopupComponent, setPopupComponent] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('react-leaflet').then((mod) => {
        setMarkerComponent(() => mod.Marker);
        setPopupComponent(() => mod.Popup);
      });
    }
  }, []);

  if (!MarkerComponent) {
    return null;
  }

  return (
    <MarkerComponent position={position}>
      {popup && PopupComponent && <PopupComponent>{popup}</PopupComponent>}
    </MarkerComponent>
  );
}
