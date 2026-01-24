'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

type ReactLeafletModule = typeof import('react-leaflet');
type LeafletModule = typeof import('leaflet');

function MapUpdater({
  center,
  zoom,
  useMap,
}: {
  center: [number, number];
  zoom: number;
  useMap: ReactLeafletModule['useMap'];
}) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
    setTimeout(() => map.invalidateSize(), 0);
  }, [map, center, zoom]);

  return null;
}

function MapCleanup({ useMap }: { useMap: ReactLeafletModule['useMap'] }) {
  const map = useMap();

  useEffect(() => {
    return () => {
      map.remove();
    };
  }, [map]);

  return null;
}

export default function MapInternalClient({
  center,
  zoom = 13,
  height = '300px',
  children,
}: {
  center: [number, number];
  zoom?: number;
  height?: string;
  children?: React.ReactNode;
}) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [leaflet, setLeaflet] = useState<LeafletModule | null>(null);
  const [reactLeaflet, setReactLeaflet] = useState<ReactLeafletModule | null>(
    null
  );
  const mapId = useRef(
    `leaflet-map-${Math.random().toString(36).slice(2)}`
  ).current;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [canRenderMap, setCanRenderMap] = useState(false);
  const [mapKey, setMapKey] = useState(0);

  useEffect(() => {
    setIsInitialized(true);
    return () => {
      setIsInitialized(false);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    Promise.all([import('react-leaflet'), import('leaflet')]).then(
      ([reactLeafletModule, leafletModule]) => {
        if (!isMounted) {
          return;
        }
        const defaultIcon = leafletModule.Icon.Default.prototype as {
          _getIconUrl?: () => string;
        };
        delete defaultIcon._getIconUrl;
        leafletModule.Icon.Default.mergeOptions({
          iconRetinaUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
        setLeaflet(leafletModule);
        setReactLeaflet(reactLeafletModule);
      }
    );

    return () => {
      isMounted = false;
    };
  }, []);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (container) {
      const existingLeafletContainer = container.querySelector(
        '.leaflet-container'
      ) as (HTMLElement & { _leaflet_id?: number }) | null;
      if (existingLeafletContainer?._leaflet_id) {
        delete existingLeafletContainer._leaflet_id;
      }
      if (existingLeafletContainer) {
        existingLeafletContainer.innerHTML = '';
      }
    }
    setCanRenderMap(false);
    const frame = requestAnimationFrame(() => {
      setMapKey((prev) => prev + 1);
      setCanRenderMap(true);
    });
    return () => {
      cancelAnimationFrame(frame);
      setCanRenderMap(false);
    };
  }, [mapId]);

  if (!isInitialized || !leaflet || !reactLeaflet) {
    return (
      <div
        className="flex items-center justify-center rounded-lg bg-gray-100"
        style={{ height }}
      >
        <div className="text-gray-500">Loading map...</div>
      </div>
    );
  }

  const { MapContainer, TileLayer, useMap } = reactLeaflet;

  return (
    <div
      key={`leaflet-wrapper-${mapKey}`}
      ref={containerRef}
      style={{ height, width: '100%' }}
    >
      {canRenderMap && (
        <MapContainer
          key={`leaflet-map-${mapKey}`}
          id={mapId}
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
        >
          <MapUpdater center={center} zoom={zoom} useMap={useMap} />
          <MapCleanup useMap={useMap} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {children}
        </MapContainer>
      )}
    </div>
  );
}
