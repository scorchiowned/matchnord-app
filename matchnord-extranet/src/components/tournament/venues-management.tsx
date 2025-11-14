'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Plus,
  Edit,
  Trash2,
  MapPin,
  Square,
  RefreshCw,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { VenueLocationFormV2 } from './venue-location-form-v2';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

interface Venue {
  id: string;
  name: string;
  address?: string;
  xCoordinate?: number;
  yCoordinate?: number;
}

interface Pitch {
  id: string;
  name: string;
  number?: string;
  surface?: string;
  size?: string;
  description?: string;
  isAvailable: boolean;
}

const surfaceTypes = [
  { value: 'natural_grass', label: 'Natural Grass' },
  { value: 'artificial_turf', label: 'Artificial Turf' },
  { value: 'hybrid_grass', label: 'Hybrid Grass' },
  { value: 'indoor', label: 'Indoor' },
  { value: 'concrete', label: 'Concrete' },
  { value: 'wood', label: 'Wood' },
];

const sizeTypes = [
  { value: 'full_size', label: 'Full Size' },
  { value: 'half_size', label: 'Half Size' },
  { value: 'indoor', label: 'Indoor' },
  { value: 'mini', label: 'Mini' },
];

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

  // Pitches management state
  const [expandedVenues, setExpandedVenues] = useState<Set<string>>(new Set());
  const [pitchesByVenue, setPitchesByVenue] = useState<Map<string, Pitch[]>>(
    new Map()
  );
  const [loadingPitches, setLoadingPitches] = useState<Set<string>>(new Set());
  const [isPitchDialogOpen, setIsPitchDialogOpen] = useState(false);
  const [isPitchSubmitting, setIsPitchSubmitting] = useState(false);
  const [editingPitch, setEditingPitch] = useState<Pitch | null>(null);
  const [currentVenueForPitch, setCurrentVenueForPitch] =
    useState<Venue | null>(null);

  // Pitch form state
  const [pitchFormData, setPitchFormData] = useState({
    name: '',
    number: '',
    surface: '',
    size: '',
    description: '',
    isAvailable: true,
  });

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

  // Toggle venue expansion and fetch pitches
  const toggleVenueExpansion = async (venueId: string) => {
    const isExpanded = expandedVenues.has(venueId);

    if (isExpanded) {
      // Collapse
      setExpandedVenues((prev) => {
        const newSet = new Set(prev);
        newSet.delete(venueId);
        return newSet;
      });
    } else {
      // Expand - fetch pitches if not already loaded
      setExpandedVenues((prev) => new Set(prev).add(venueId));

      if (!pitchesByVenue.has(venueId)) {
        setLoadingPitches((prev) => new Set(prev).add(venueId));
        try {
          const response = await fetch(`/api/v1/venues/${venueId}/pitches`, {
            credentials: 'include',
          });

          if (response.ok) {
            const pitchesData = await response.json();
            setPitchesByVenue((prev) => {
              const newMap = new Map(prev);
              newMap.set(venueId, pitchesData);
              return newMap;
            });
          } else {
            toast.error('Failed to load pitches');
          }
        } catch (error) {
          console.error('Error fetching pitches:', error);
          toast.error('Failed to load pitches');
        } finally {
          setLoadingPitches((prev) => {
            const newSet = new Set(prev);
            newSet.delete(venueId);
            return newSet;
          });
        }
      }
    }
  };

  // Pitch management functions
  const handlePitchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pitchFormData.name || !currentVenueForPitch) {
      toast.error('Pitch name is required');
      return;
    }

    try {
      setIsPitchSubmitting(true);

      const url = editingPitch
        ? `/api/v1/pitches/${editingPitch.id}`
        : `/api/v1/venues/${currentVenueForPitch.id}/pitches`;

      const method = editingPitch ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(pitchFormData),
      });

      if (response.ok) {
        const newPitch = await response.json();
        const venueId = currentVenueForPitch.id;

        if (editingPitch) {
          setPitchesByVenue((prev) => {
            const newMap = new Map(prev);
            const pitches = newMap.get(venueId) || [];
            newMap.set(
              venueId,
              pitches.map((pitch) =>
                pitch.id === editingPitch.id ? newPitch : pitch
              )
            );
            return newMap;
          });
          toast.success('Pitch updated successfully');
        } else {
          setPitchesByVenue((prev) => {
            const newMap = new Map(prev);
            const pitches = newMap.get(venueId) || [];
            newMap.set(venueId, [...pitches, newPitch]);
            return newMap;
          });
          toast.success('Pitch added successfully');
        }

        resetPitchForm();
        setIsPitchDialogOpen(false);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save pitch');
      }
    } catch (error) {
      console.error('Error saving pitch:', error);
      toast.error('Failed to save pitch');
    } finally {
      setIsPitchSubmitting(false);
    }
  };

  const handlePitchEdit = (pitch: Pitch, venue: Venue) => {
    setEditingPitch(pitch);
    setCurrentVenueForPitch(venue);
    setPitchFormData({
      name: pitch.name,
      number: pitch.number || '',
      surface: pitch.surface || '',
      size: pitch.size || '',
      description: pitch.description || '',
      isAvailable: pitch.isAvailable,
    });
    setIsPitchDialogOpen(true);
  };

  const handlePitchDelete = async (pitchId: string, venueId: string) => {
    if (!confirm('Are you sure you want to delete this pitch?')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/pitches/${pitchId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setPitchesByVenue((prev) => {
          const newMap = new Map(prev);
          const pitches = newMap.get(venueId) || [];
          newMap.set(
            venueId,
            pitches.filter((pitch) => pitch.id !== pitchId)
          );
          return newMap;
        });
        toast.success('Pitch deleted successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete pitch');
      }
    } catch (error) {
      console.error('Error deleting pitch:', error);
      toast.error('Failed to delete pitch');
    }
  };

  const resetPitchForm = () => {
    setPitchFormData({
      name: '',
      number: '',
      surface: '',
      size: '',
      description: '',
      isAvailable: true,
    });
    setEditingPitch(null);
    setCurrentVenueForPitch(null);
  };

  const handlePitchDialogClose = () => {
    setIsPitchDialogOpen(false);
    resetPitchForm();
  };

  const openAddPitchDialog = (venue: Venue) => {
    setCurrentVenueForPitch(venue);
    resetPitchForm();
    setIsPitchDialogOpen(true);
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
                    <TableHead className="w-12 bg-[#489a66] text-white"></TableHead>
                    <TableHead className="bg-[#489a66] text-white">
                      Venue Name
                    </TableHead>
                    <TableHead className="bg-[#489a66] text-white">
                      Address
                    </TableHead>
                    <TableHead className="bg-[#489a66] text-white">
                      Location
                    </TableHead>
                    <TableHead className="bg-[#489a66] text-right text-white">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {venues.map((venue) => {
                    const isExpanded = expandedVenues.has(venue.id);
                    const pitches = pitchesByVenue.get(venue.id) || [];
                    const isLoadingPitches = loadingPitches.has(venue.id);

                    return (
                      <>
                        <TableRow key={venue.id}>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleVenueExpansion(venue.id)}
                              className="h-8 w-8 p-0"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
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
                                <span className="text-green-600">
                                  📍 Located
                                </span>
                              ) : (
                                <span className="text-gray-400">
                                  No location
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
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
                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={5} className="p-0">
                              <div className="bg-muted/30 p-4">
                                {isLoadingPitches ? (
                                  <div className="flex items-center justify-center py-4">
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    <span className="text-sm text-muted-foreground">
                                      Loading pitches...
                                    </span>
                                  </div>
                                ) : pitches.length === 0 ? (
                                  <div className="py-4 text-center">
                                    <p className="mb-3 text-sm text-muted-foreground">
                                      No pitches yet
                                    </p>
                                    <Button
                                      size="sm"
                                      onClick={() => openAddPitchDialog(venue)}
                                    >
                                      <Plus className="mr-2 h-4 w-4" />
                                      Add Pitch
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-2">
                                        <Square className="h-4 w-4" />
                                        <span className="text-sm font-medium">
                                          Pitches ({pitches.length})
                                        </span>
                                      </div>
                                      <Button
                                        size="sm"
                                        onClick={() =>
                                          openAddPitchDialog(venue)
                                        }
                                      >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Pitch
                                      </Button>
                                    </div>
                                    <div className="rounded-md border bg-background">
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead className="bg-[#489a66] text-white">
                                              Pitch Name
                                            </TableHead>
                                            <TableHead className="bg-[#489a66] text-white">
                                              Number
                                            </TableHead>
                                            <TableHead className="bg-[#489a66] text-white">
                                              Surface
                                            </TableHead>
                                            <TableHead className="bg-[#489a66] text-white">
                                              Size
                                            </TableHead>
                                            <TableHead className="bg-[#489a66] text-white">
                                              Status
                                            </TableHead>
                                            <TableHead className="bg-[#489a66] text-right text-white">
                                              Actions
                                            </TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {pitches.map((pitch) => (
                                            <TableRow key={pitch.id}>
                                              <TableCell>
                                                <div className="font-medium">
                                                  {pitch.name}
                                                </div>
                                                {pitch.description && (
                                                  <div className="text-xs text-muted-foreground">
                                                    {pitch.description}
                                                  </div>
                                                )}
                                              </TableCell>
                                              <TableCell>
                                                <div className="text-sm">
                                                  {pitch.number || '-'}
                                                </div>
                                              </TableCell>
                                              <TableCell>
                                                <div className="text-sm">
                                                  {pitch.surface
                                                    ? surfaceTypes.find(
                                                        (s) =>
                                                          s.value ===
                                                          pitch.surface
                                                      )?.label || pitch.surface
                                                    : '-'}
                                                </div>
                                              </TableCell>
                                              <TableCell>
                                                <div className="text-sm">
                                                  {pitch.size
                                                    ? sizeTypes.find(
                                                        (s) =>
                                                          s.value === pitch.size
                                                      )?.label || pitch.size
                                                    : '-'}
                                                </div>
                                              </TableCell>
                                              <TableCell>
                                                <Badge
                                                  variant={
                                                    pitch.isAvailable
                                                      ? 'default'
                                                      : 'secondary'
                                                  }
                                                >
                                                  {pitch.isAvailable
                                                    ? 'Available'
                                                    : 'Unavailable'}
                                                </Badge>
                                              </TableCell>
                                              <TableCell className="text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                      handlePitchEdit(
                                                        pitch,
                                                        venue
                                                      )
                                                    }
                                                  >
                                                    <Edit className="h-4 w-4" />
                                                  </Button>
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                      handlePitchDelete(
                                                        pitch.id,
                                                        venue.id
                                                      )
                                                    }
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
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pitch Dialog */}
      <Dialog open={isPitchDialogOpen} onOpenChange={setIsPitchDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingPitch ? 'Edit Pitch' : 'Add New Pitch'}
            </DialogTitle>
            <DialogDescription>
              {editingPitch
                ? 'Update the pitch information below.'
                : `Add a new pitch to ${currentVenueForPitch?.name || 'venue'}.`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePitchSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pitch-name">Pitch Name *</Label>
                <Input
                  id="pitch-name"
                  value={pitchFormData.name}
                  onChange={(e) =>
                    setPitchFormData({
                      ...pitchFormData,
                      name: e.target.value,
                    })
                  }
                  placeholder="e.g., Main Field"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pitch-number">Pitch Number</Label>
                <Input
                  id="pitch-number"
                  value={pitchFormData.number}
                  onChange={(e) =>
                    setPitchFormData({
                      ...pitchFormData,
                      number: e.target.value,
                    })
                  }
                  placeholder="e.g., 1, A, Field 1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pitch-surface">Surface</Label>
                <Select
                  value={pitchFormData.surface}
                  onValueChange={(value) =>
                    setPitchFormData({ ...pitchFormData, surface: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select surface" />
                  </SelectTrigger>
                  <SelectContent>
                    {surfaceTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pitch-size">Size</Label>
                <Select
                  value={pitchFormData.size}
                  onValueChange={(value) =>
                    setPitchFormData({ ...pitchFormData, size: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {sizeTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pitch-description">Description</Label>
              <Textarea
                id="pitch-description"
                value={pitchFormData.description}
                onChange={(e) =>
                  setPitchFormData({
                    ...pitchFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Enter pitch description"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="pitch-available"
                checked={pitchFormData.isAvailable}
                onCheckedChange={(checked) =>
                  setPitchFormData({
                    ...pitchFormData,
                    isAvailable: checked,
                  })
                }
              />
              <Label htmlFor="pitch-available">Available for matches</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={handlePitchDialogClose}
                disabled={isPitchSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPitchSubmitting}>
                {isPitchSubmitting
                  ? 'Saving...'
                  : editingPitch
                    ? 'Update Pitch'
                    : 'Add Pitch'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
