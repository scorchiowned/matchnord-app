import dynamic from 'next/dynamic';

const MapInternal = dynamic(() => import('./MapInternalClient'), {
  ssr: false,
  loading: () => (
    <div
      className="flex items-center justify-center rounded-lg bg-gray-100"
      style={{ height: '300px' }}
    >
      <div className="text-gray-500">Loading map...</div>
    </div>
  ),
});

export default MapInternal;

