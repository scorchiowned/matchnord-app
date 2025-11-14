'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, MapPin, Square, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { PitchesManagement } from './pitches-management';
import { VenueLocationFormV2 } from './venue-location-form-v2';

interface Venue {
  id: string;
  name: string;
  address?: string;
  xCoordinate?: number;
  yCoordinate?: number;
}

interface VenuesManagementProps {
  tournamentId: string;
  onVenuesChange?: (venues: Venue[]) => void;
}

export function VenuesManagement({
  tournamentId,
  onVenuesChange,
}: VenuesManagementProps) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [managingPitchesFor, setManagingPitchesFor] = useState<Venue | null>(
    null
  );

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    xCoordinate: undefined as number | undefined,
    yCoordinate: undefined as number | undefined,
  });

  // Fetch venues
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch venues
        const venuesResponse = await fetch(
          `/api/v1/tournaments/${tournamentId}/venues`,
          {
            credentials: 'include',
          }
        );

        if (venuesResponse.ok) {
          const venuesData = await venuesResponse.json();
          setVenues(venuesData);
          onVenuesChange?.(venuesData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [tournamentId]);

  const handleSave = async (data: {
    name: string;
    address?: string;
    xCoordinate?: number;
    yCoordinate?: number;
  }) => {
    try {
      setIsSubmitting(true);

      const url = editingVenue
        ? `/api/v1/venues/${editingVenue.id}`
        : `/api/v1/tournaments/${tournamentId}/venues`;

      const method = editingVenue ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const newVenue = await response.json();

        if (editingVenue) {
          const updatedVenues = venues.map((venue) =>
            venue.id === editingVenue.id ? newVenue : venue
          );
          setVenues(updatedVenues);
          onVenuesChange?.(updatedVenues);
          toast.success('Venue updated successfully');
        } else {
          const updatedVenues = [...venues, newVenue];
          setVenues(updatedVenues);
          onVenuesChange?.(updatedVenues);
          toast.success('Venue added successfully');
        }

        resetForm();
        setIsDialogOpen(false);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save venue');
      }
    } catch (error) {
      console.error('Error saving venue:', error);
      toast.error('Failed to save venue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (venue: Venue) => {
    setEditingVenue(venue);
    setFormData({
      name: venue.name,
      address: venue.address || '',
      xCoordinate: venue.xCoordinate,
      yCoordinate: venue.yCoordinate,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (venueId: string) => {
    if (!confirm('Are you sure you want to delete this venue?')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/venues/${venueId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        const updatedVenues = venues.filter((venue) => venue.id !== venueId);
        setVenues(updatedVenues);
        onVenuesChange?.(updatedVenues);
        toast.success('Venue deleted successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete venue');
      }
    } catch (error) {
      console.error('Error deleting venue:', error);
      toast.error('Failed to delete venue');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      xCoordinate: undefined,
      yCoordinate: undefined,
    });
    setEditingVenue(null);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading venues...</span>
      </div>
    );
  }

  return (
    <div>
      <Card className="border-0 shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* <MapPin className="h-5 w-5" /> */}
              <span>Venues</span>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Venue
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[800px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingVenue ? 'Edit Venue' : 'Add New Venue'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingVenue
                      ? 'Update the venue information and location below.'
                      : 'Add a new venue for this tournament with location details.'}
                  </DialogDescription>
                </DialogHeader>
                <VenueLocationFormV2
                  initialData={{
                    name: formData.name,
                    address: formData.address,
                    xCoordinate: formData.xCoordinate,
                    yCoordinate: formData.yCoordinate,
                  }}
                  onSave={handleSave}
                  onCancel={handleDialogClose}
                  isLoading={isSubmitting}
                />
              </DialogContent>
            </Dialog>
          </CardTitle>
          {/* <CardDescription>Manage venues for this tournament</CardDescription> */}
        </CardHeader>
        <CardContent>
          {venues.length === 0 ? (
            <div className="py-12 text-center">
              <MapPin className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No venues yet</h3>
              <p className="mb-4 text-muted-foreground">
                Get started by adding the first venue for this tournament.
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Venue
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Venue Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {venues.map((venue) => (
                    <TableRow key={venue.id}>
                      <TableCell>
                        <div className="font-medium">{venue.name}</div>
                      </TableCell>
                      <TableCell>
                        <div
                          className="max-w-xs truncate text-sm"
                          title={venue.address}
                        >
                          {venue.address || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {venue.xCoordinate && venue.yCoordinate ? (
                            <span className="text-green-600">📍 Located</span>
                          ) : (
                            <span className="text-gray-400">No location</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setManagingPitchesFor(venue)}
                            title="Manage Pitches"
                          >
                            <Square className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(venue)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(venue.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pitches Management */}
      {managingPitchesFor && (
        <div className="mt-6">
          <PitchesManagement
            venueId={managingPitchesFor.id}
            venueName={managingPitchesFor.name}
          />
          <div className="mt-4 flex justify-end">
            <Button
              variant="outline"
              onClick={() => setManagingPitchesFor(null)}
            >
              Close Pitches Management
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
