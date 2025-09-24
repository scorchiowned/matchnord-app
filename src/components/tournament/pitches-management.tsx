'use client';

import { useState, useEffect } from 'react';
// import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Square } from 'lucide-react';
import { toast } from 'sonner';

interface Pitch {
  id: string;
  name: string;
  number?: string;
  surface?: string;
  size?: string;
  description?: string;
  isAvailable: boolean;
}

interface PitchesManagementProps {
  venueId: string;
  venueName: string;
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

export function PitchesManagement({
  venueId,
  venueName,
}: PitchesManagementProps) {
  // const t = useTranslations();
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPitch, setEditingPitch] = useState<Pitch | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    number: '',
    surface: '',
    size: '',
    description: '',
    isAvailable: true,
  });

  // Fetch pitches
  useEffect(() => {
    const fetchPitches = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/v1/venues/${venueId}/pitches`, {
          credentials: 'include',
        });

        if (response.ok) {
          const pitchesData = await response.json();
          setPitches(pitchesData);
        }
      } catch (error) {
        console.error('Error fetching pitches:', error);
        toast.error('Failed to load pitches');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPitches();
  }, [venueId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error('Pitch name is required');
      return;
    }

    try {
      setIsSubmitting(true);

      const url = editingPitch
        ? `/api/v1/pitches/${editingPitch.id}`
        : `/api/v1/venues/${venueId}/pitches`;

      const method = editingPitch ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newPitch = await response.json();

        if (editingPitch) {
          setPitches(
            pitches.map((pitch) =>
              pitch.id === editingPitch.id ? newPitch : pitch
            )
          );
          toast.success('Pitch updated successfully');
        } else {
          setPitches([...pitches, newPitch]);
          toast.success('Pitch added successfully');
        }

        resetForm();
        setIsDialogOpen(false);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save pitch');
      }
    } catch (error) {
      console.error('Error saving pitch:', error);
      toast.error('Failed to save pitch');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (pitch: Pitch) => {
    setEditingPitch(pitch);
    setFormData({
      name: pitch.name,
      number: pitch.number || '',
      surface: pitch.surface || '',
      size: pitch.size || '',
      description: pitch.description || '',
      isAvailable: pitch.isAvailable,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (pitchId: string) => {
    if (!confirm('Are you sure you want to delete this pitch?')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/pitches/${pitchId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setPitches(pitches.filter((pitch) => pitch.id !== pitchId));
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

  const resetForm = () => {
    setFormData({
      name: '',
      number: '',
      surface: '',
      size: '',
      description: '',
      isAvailable: true,
    });
    setEditingPitch(null);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading pitches...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Square className="h-5 w-5" />
            <span>Pitches ({pitches.length})</span>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Add Pitch
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {editingPitch ? 'Edit Pitch' : 'Add New Pitch'}
                </DialogTitle>
                <DialogDescription>
                  {editingPitch
                    ? 'Update the pitch information below.'
                    : `Add a new pitch to ${venueName}.`}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Pitch Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="e.g., Main Field"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="number">Pitch Number</Label>
                    <Input
                      id="number"
                      value={formData.number}
                      onChange={(e) =>
                        setFormData({ ...formData, number: e.target.value })
                      }
                      placeholder="e.g., 1, A, Field 1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="surface">Surface</Label>
                    <Select
                      value={formData.surface}
                      onValueChange={(value) =>
                        setFormData({ ...formData, surface: value })
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
                    <Label htmlFor="size">Size</Label>
                    <Select
                      value={formData.size}
                      onValueChange={(value) =>
                        setFormData({ ...formData, size: value })
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
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Enter pitch description"
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isAvailable"
                    checked={formData.isAvailable}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isAvailable: checked })
                    }
                  />
                  <Label htmlFor="isAvailable">Available for matches</Label>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDialogClose}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                      ? 'Saving...'
                      : editingPitch
                        ? 'Update Pitch'
                        : 'Add Pitch'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
        <CardDescription>Manage pitches for {venueName}</CardDescription>
      </CardHeader>
      <CardContent>
        {pitches.length === 0 ? (
          <div className="py-12 text-center">
            <Square className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No pitches yet</h3>
            <p className="mb-4 text-muted-foreground">
              Get started by adding the first pitch for this venue.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Pitch
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pitch Name</TableHead>
                  <TableHead>Number</TableHead>
                  <TableHead>Surface</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pitches.map((pitch) => (
                  <TableRow key={pitch.id}>
                    <TableCell>
                      <div className="font-medium">{pitch.name}</div>
                      {pitch.description && (
                        <div className="text-sm text-muted-foreground">
                          {pitch.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{pitch.number || '-'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {pitch.surface
                          ? surfaceTypes.find((s) => s.value === pitch.surface)
                              ?.label || pitch.surface
                          : '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {pitch.size
                          ? sizeTypes.find((s) => s.value === pitch.size)
                              ?.label || pitch.size
                          : '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={pitch.isAvailable ? 'default' : 'secondary'}
                      >
                        {pitch.isAvailable ? 'Available' : 'Unavailable'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(pitch)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(pitch.id)}
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
  );
}
