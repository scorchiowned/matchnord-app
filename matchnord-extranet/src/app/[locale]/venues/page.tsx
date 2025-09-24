'use client';

import { useState } from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MainNavigation } from '@/components/navigation/main-navigation';
import {
  MapPin,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  X,
  // Trophy,
  Users,
  Calendar,
} from 'lucide-react';

// Mock data - in a real app, this would fetch from the API
const mockVenues = [
  {
    id: '1',
    name: 'Olympic Stadium',
    city: 'Helsinki',
    address: 'Paavo Nurmen tie 1, 00250 Helsinki',
    capacity: 40000,
    surface: 'Natural grass',
    type: 'stadium',
    status: 'active',
    facilities: ['Parking', 'Food & Beverage', 'VIP Areas', 'Media Center'],
    tournaments: ['Youth Championship 2024'],
    upcomingMatches: 3,
    lastMatch: '2024-06-10',
    coordinates: { lat: 60.1875, lng: 24.9294 },
    phone: '+358 9 234 5678',
    email: 'info@olympicstadium.fi',
    website: 'https://olympicstadium.fi',
  },
  {
    id: '2',
    name: 'Espoo Sports Center',
    city: 'Espoo',
    address: 'Urheilupuisto 1, 02100 Espoo',
    capacity: 8000,
    surface: 'Hybrid grass',
    type: 'sports_center',
    status: 'active',
    facilities: ['Parking', 'Cafeteria', 'Training Fields', 'Gym'],
    tournaments: ['Youth Championship 2024'],
    upcomingMatches: 2,
    lastMatch: '2024-06-08',
    coordinates: { lat: 60.2055, lng: 24.6559 },
    phone: '+358 9 345 6789',
    email: 'info@espoosports.fi',
    website: 'https://espoosports.fi',
  },
  {
    id: '3',
    name: 'Oulu Sports Center',
    city: 'Oulu',
    address: 'Urheilukatu 1, 90100 Oulu',
    capacity: 12000,
    surface: 'Artificial turf',
    type: 'sports_center',
    status: 'active',
    facilities: ['Parking', 'Restaurant', 'Indoor Arena', 'Swimming Pool'],
    tournaments: ['Youth Championship 2024'],
    upcomingMatches: 1,
    lastMatch: '2024-06-05',
    coordinates: { lat: 65.0121, lng: 25.4651 },
    phone: '+358 8 456 7890',
    email: 'info@oulusports.fi',
    website: 'https://oulusports.fi',
  },
  {
    id: '4',
    name: 'Summer Arena',
    city: 'Vantaa',
    address: 'Kesäpuisto 1, 01300 Vantaa',
    capacity: 15000,
    surface: 'Natural grass',
    type: 'stadium',
    status: 'active',
    facilities: ['Parking', 'Food Court', 'Fan Zone', 'Merchandise Shop'],
    tournaments: ['Summer Cup 2024'],
    upcomingMatches: 4,
    lastMatch: '2024-06-12',
    coordinates: { lat: 60.2934, lng: 25.0378 },
    phone: '+358 9 567 8901',
    email: 'info@summerarena.fi',
    website: 'https://summerarena.fi',
  },
  {
    id: '5',
    name: 'Central Stadium',
    city: 'Tampere',
    address: 'Keskustadion 1, 33100 Tampere',
    capacity: 25000,
    surface: 'Hybrid grass',
    type: 'stadium',
    status: 'active',
    facilities: ['Parking', 'Restaurant', 'VIP Suites', 'Press Box'],
    tournaments: ['Spring League 2024'],
    upcomingMatches: 2,
    lastMatch: '2024-06-09',
    coordinates: { lat: 61.4978, lng: 23.761 },
    phone: '+358 3 678 9012',
    email: 'info@centralstadium.fi',
    website: 'https://centralstadium.fi',
  },
];

const mockCities = ['Helsinki', 'Espoo', 'Oulu', 'Vantaa', 'Tampere'];

const mockVenueTypes = [
  'stadium',
  'sports_center',
  'training_ground',
  'indoor_arena',
];

export default function VenuesPage() {
  const t = useTranslations();
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [capacityFilter, setCapacityFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Filter venues based on search and filters
  const filteredVenues = mockVenues.filter((venue) => {
    const matchesSearch =
      venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venue.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venue.address.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCity = cityFilter === 'all' || venue.city === cityFilter;
    const matchesType = typeFilter === 'all' || venue.type === typeFilter;

    let matchesCapacity = true;
    if (capacityFilter === 'small') {
      matchesCapacity = venue.capacity < 10000;
    } else if (capacityFilter === 'medium') {
      matchesCapacity = venue.capacity >= 10000 && venue.capacity < 25000;
    } else if (capacityFilter === 'large') {
      matchesCapacity = venue.capacity >= 25000;
    }

    return matchesSearch && matchesCity && matchesType && matchesCapacity;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setCityFilter('all');
    setTypeFilter('all');
    setCapacityFilter('all');
  };

  const getVenueTypeLabel = (type: string) => {
    switch (type) {
      case 'stadium':
        return t('venue.types.stadium');
      case 'sports_center':
        return t('venue.types.sportsCenter');
      case 'training_ground':
        return t('venue.types.trainingGround');
      case 'indoor_arena':
        return t('venue.types.indoorArena');
      default:
        return type;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <MainNavigation />

      <main className="container mx-auto py-6">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">
                {t('venue.title')}
              </h1>
              <p className="text-xl text-muted-foreground">
                {t('venue.description')}
              </p>
            </div>
            <Button asChild>
              <Link href="/admin/venues/new">
                <Plus className="mr-2 h-4 w-4" />
                {t('venue.addVenue')}
              </Link>
            </Button>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-1 items-center space-x-2">
                  <div className="relative max-w-sm flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t('venue.searchPlaceholder')}
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={cityFilter} onValueChange={setCityFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder={t('venue.allCities')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {t('venue.allCities')}
                      </SelectItem>
                      {mockCities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    {t('venue.moreFilters')}
                  </Button>
                  {(searchTerm ||
                    cityFilter !== 'all' ||
                    typeFilter !== 'all' ||
                    capacityFilter !== 'all') && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="mr-2 h-4 w-4" />
                      {t('common.clear')}
                    </Button>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    {filteredVenues.length} {t('venue.venues')}
                  </Badge>
                </div>
              </div>

              {/* Expanded Filters */}
              {showFilters && (
                <div className="mt-4 border-t pt-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        {t('venue.venueType')}
                      </Label>
                      <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('venue.allTypes')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            {t('venue.allTypes')}
                          </SelectItem>
                          {mockVenueTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {getVenueTypeLabel(type)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        {t('venue.capacity')}
                      </Label>
                      <Select
                        value={capacityFilter}
                        onValueChange={setCapacityFilter}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('venue.allCapacities')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            {t('venue.allCapacities')}
                          </SelectItem>
                          <SelectItem value="small">
                            {t('venue.small')}
                          </SelectItem>
                          <SelectItem value="medium">
                            {t('venue.medium')}
                          </SelectItem>
                          <SelectItem value="large">
                            {t('venue.large')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        {t('venue.surfaceType')}
                      </Label>
                      <Select defaultValue="all">
                        <SelectTrigger>
                          <SelectValue placeholder={t('venue.allSurfaces')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            {t('venue.allSurfaces')}
                          </SelectItem>
                          <SelectItem value="natural">
                            {t('venue.naturalGrass')}
                          </SelectItem>
                          <SelectItem value="hybrid">
                            {t('venue.hybridGrass')}
                          </SelectItem>
                          <SelectItem value="artificial">
                            {t('venue.artificialTurf')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Venues Table */}
          <Card>
            <CardHeader>
              <CardTitle>Venues</CardTitle>
              <CardDescription>
                {filteredVenues.length} venues found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Surface</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Upcoming Matches</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVenues.map((venue) => (
                    <TableRow key={venue.id}>
                      <TableCell className="font-medium">
                        <div className="space-y-1">
                          <div>{venue.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {venue.address}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{venue.city}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{venue.capacity.toLocaleString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>{venue.surface}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getVenueTypeLabel(venue.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{venue.upcomingMatches}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            venue.status === 'active' ? 'default' : 'secondary'
                          }
                        >
                          {venue.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/venues/${venue.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/admin/venues/${venue.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Empty State */}
          {filteredVenues.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <MapPin className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">
                  {searchTerm ||
                  cityFilter !== 'all' ||
                  typeFilter !== 'all' ||
                  capacityFilter !== 'all'
                    ? t('venue.noVenuesFound')
                    : t('venue.noVenuesInSystem')}
                </h3>
                <p className="mb-4 text-muted-foreground">
                  {searchTerm ||
                  cityFilter !== 'all' ||
                  typeFilter !== 'all' ||
                  capacityFilter !== 'all'
                    ? t('venue.tryAdjustingFilters')
                    : t('venue.noVenuesDescription')}
                </p>
                {searchTerm ||
                cityFilter !== 'all' ||
                typeFilter !== 'all' ||
                capacityFilter !== 'all' ? (
                  <Button onClick={clearFilters}>
                    {t('common.clearFilters')}
                  </Button>
                ) : (
                  <Button asChild>
                    <Link href="/admin/venues/new">
                      {t('venue.addFirstVenue')}
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
