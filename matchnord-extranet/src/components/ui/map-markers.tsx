'use client';

import { useEffect, useState } from 'react';
import type { LeafletEvent, Marker as LeafletMarker } from 'leaflet';

type ReactLeafletModule = typeof import('react-leaflet');

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
  const [MarkerComponent, setMarkerComponent] =
    useState<ReactLeafletModule['Marker'] | null>(null);
  const [PopupComponent, setPopupComponent] =
    useState<ReactLeafletModule['Popup'] | null>(null);

  useEffect(() => {
    let isMounted = true;
    import('react-leaflet').then((mod) => {
      if (!isMounted) {
        return;
      }
      setMarkerComponent(() => mod.Marker);
      setPopupComponent(() => mod.Popup);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setMarkerPosition(position);
  }, [position]);

  if (!MarkerComponent) {
    return null;
  }

  const eventHandlers = {
    dragend: (e: LeafletEvent) => {
      const marker = e.target as LeafletMarker;
      const newPosition = marker.getLatLng();
      setMarkerPosition([newPosition.lat, newPosition.lng]);
      onPositionChange(newPosition.lat, newPosition.lng);
    },
  };

  return (
    <MarkerComponent
      key={`marker-${position[0]}-${position[1]}`}
      position={markerPosition}
      draggable
      eventHandlers={eventHandlers}
    >
      {popup && PopupComponent && <PopupComponent>{popup}</PopupComponent>}
    </MarkerComponent>
  );
}

interface StaticMarkerProps {
  position: [number, number];
  popup?: React.ReactNode;
}

export function StaticMarker({ position, popup }: StaticMarkerProps) {
  const [MarkerComponent, setMarkerComponent] =
    useState<ReactLeafletModule['Marker'] | null>(null);
  const [PopupComponent, setPopupComponent] =
    useState<ReactLeafletModule['Popup'] | null>(null);

  useEffect(() => {
    let isMounted = true;
    import('react-leaflet').then((mod) => {
      if (!isMounted) {
        return;
      }
      setMarkerComponent(() => mod.Marker);
      setPopupComponent(() => mod.Popup);
    });

    return () => {
      isMounted = false;
    };
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
