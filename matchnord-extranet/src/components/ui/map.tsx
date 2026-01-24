'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

interface MapProps {
  center: [number, number];
  zoom?: number;
  className?: string;
  height?: string;
  children?: React.ReactNode;
}

// Simple loading component
const MapLoading = ({ height }: { height: string }) => (
  <div
    className="flex items-center justify-center rounded-lg bg-gray-100"
    style={{ height }}
  >
    <div className="text-gray-500">Loading map...</div>
  </div>
);

// Dynamic import of the entire map component to avoid SSR issues
const DynamicMap = dynamic(() => import('./map-internal'), {
  ssr: false,
  loading: () => <MapLoading height="300px" />,
});

export function Map({
  center,
  zoom = 13,
  className = '',
  height = '300px',
  children,
}: MapProps) {
  return (
    <div
      className={`overflow-hidden rounded-lg ${className}`}
      style={{ height }}
    >
      <DynamicMap center={center} zoom={zoom} height={height}>
        {children}
      </DynamicMap>
    </div>
  );
}

// Re-export marker components from client-only markers
export { DraggableMarker, StaticMarker } from './map-markers';
