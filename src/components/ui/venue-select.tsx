'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Plus, Search } from 'lucide-react';

interface Venue {
  id: string;
  name: string;
  streetName?: string;
  postalCode?: string;
  city?: string;
}

interface VenueSelectProps {
  value?: string;
  onValueChange: (venueId: string) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
}

// Mock data - in a real app, this would fetch from the API
const mockVenues: Venue[] = [
  {
    id: '1',
    name: 'Olympic Stadium',
    streetName: 'Paavo Nurmen tie 1',
    postalCode: '00250',
    city: 'Helsinki',
  },
  {
    id: '2',
    name: 'Espoo Sports Center',
    streetName: 'Urheilupuisto 1',
    postalCode: '02100',
    city: 'Espoo',
  },
  {
    id: '3',
    name: 'Oulu Sports Center',
    streetName: 'Urheilukatu 1',
    postalCode: '90100',
    city: 'Oulu',
  },
  {
    id: '4',
    name: 'Summer Arena',
    streetName: 'Kesäpuisto 1',
    postalCode: '01300',
    city: 'Vantaa',
  },
  {
    id: '5',
    name: 'Central Stadium',
    streetName: 'Keskustadion 1',
    postalCode: '33100',
    city: 'Tampere',
  },
];

export function VenueSelect({
  value,
  onValueChange,
  label = 'Venue',
  required = false,
  placeholder = 'Select or create a venue',
}: VenueSelectProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSelectDialogOpen, setIsSelectDialogOpen] = useState(false);
  const [newVenueData, setNewVenueData] = useState({
    name: '',
    streetName: '',
    postalCode: '',
    city: '',
  });

  const selectedVenue = mockVenues.find((venue) => venue.id === value);

  const filteredVenues = mockVenues.filter((venue) => {
    const matchesSearch =
      venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (venue.city &&
        venue.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (venue.streetName &&
        venue.streetName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCity = cityFilter === 'all' || venue.city === cityFilter;

    return matchesSearch && matchesCity;
  });

  const handleCreateVenue = () => {
    // In a real app, this would make an API call to create the venue
    const newVenue: Venue = {
      id: Date.now().toString(),
      name: newVenueData.name,
      streetName: newVenueData.streetName,
      postalCode: newVenueData.postalCode,
      city: newVenueData.city,
    };

    // Add to mock data (in real app, this would be handled by the API)
    mockVenues.push(newVenue);

    // Select the new venue
    onValueChange(newVenue.id);
    setIsCreateDialogOpen(false);
    setNewVenueData({
      name: '',
      streetName: '',
      postalCode: '',
      city: '',
    });
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="venue">
        {label} {required && '*'}
      </Label>

      <div className="flex space-x-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1 justify-start"
          onClick={() => setIsSelectDialogOpen(true)}
        >
          {selectedVenue ? (
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>
                {selectedVenue.name} ({selectedVenue.city})
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Select Venue Dialog */}
      <Dialog open={isSelectDialogOpen} onOpenChange={setIsSelectDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Select Venue</DialogTitle>
            <DialogDescription>
              Choose an existing venue for your tournament
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search venues..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All cities</SelectItem>
                  {Array.from(
                    new Set(mockVenues.map((v) => v.city).filter(Boolean))
                  ).map((city) => (
                    <SelectItem key={city} value={city!}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Venues List */}
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {filteredVenues.map((venue) => (
                <Card
                  key={venue.id}
                  className={`cursor-pointer transition-colors hover:bg-muted ${
                    value === venue.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => {
                    onValueChange(venue.id);
                    setIsSelectDialogOpen(false);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="space-y-1">
                      <h3 className="font-medium">{venue.name}</h3>
                      <div className="text-sm text-muted-foreground">
                        {venue.streetName && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{venue.streetName}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          {venue.postalCode && <span>{venue.postalCode}</span>}
                          {venue.city && <span>{venue.city}</span>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Venue Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Venue</DialogTitle>
            <DialogDescription>Add a new venue to the system</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="venue-name">Venue Name *</Label>
              <Input
                id="venue-name"
                placeholder="e.g., Olympic Stadium"
                value={newVenueData.name}
                onChange={(e) =>
                  setNewVenueData({ ...newVenueData, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="venue-address">Address</Label>
              <Input
                id="venue-address"
                placeholder="e.g., Paavo Nurmen tie 1"
                value={newVenueData.streetName}
                onChange={(e) =>
                  setNewVenueData({
                    ...newVenueData,
                    streetName: e.target.value,
                  })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="venue-postal-code">Postal Code</Label>
                <Input
                  id="venue-postal-code"
                  placeholder="e.g., 00250"
                  value={newVenueData.postalCode}
                  onChange={(e) =>
                    setNewVenueData({
                      ...newVenueData,
                      postalCode: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="venue-city">City</Label>
                <Input
                  id="venue-city"
                  placeholder="e.g., Helsinki"
                  value={newVenueData.city}
                  onChange={(e) =>
                    setNewVenueData({ ...newVenueData, city: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateVenue}
                disabled={
                  !newVenueData.name ||
                  !newVenueData.city ||
                  !(newVenueData as any).address
                }
              >
                Create Venue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
