'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { SafeHtml } from '@/components/ui/safe-html';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { InlineEditField } from './inline-edit-field';
import { InlineEditSelect } from './inline-edit-select';
import { InlineEditDate } from './inline-edit-date';
import { InlineEditImage } from './inline-edit-image';
import { InlineEditToggle } from './inline-edit-toggle';
import { InlineEditYear } from './inline-edit-year';
import {
  Trophy,
  MapPin,
  Calendar,
  Users,
  Image,
  Edit2,
  Save,
  X,
} from 'lucide-react';

interface Country {
  id: string;
  name: string;
  code: string;
}

interface Tournament {
  id: string;
  name: string;
  slug: string;
  description?: string;
  season: string;
  startDate: string;
  endDate: string;
  status: string;
  isPublished: boolean;
  city?: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  registrationDeadline?: string;
  autoAcceptTeams?: boolean;
  allowWaitlist?: boolean;
  maxTeams?: number;
  latitude?: number;
  longitude?: number;
  logo?: string;
  heroImage?: string;
  organization: {
    id: string;
    name: string;
  };
  country: {
    id: string;
    name: string;
    code: string;
  };
  _count: {
    teams: number;
    venues: number;
    divisions: number;
    matches: number;
  };
}

interface TournamentInfoEditorProps {
  tournament: Tournament;
  onUpdate: (updatedTournament: Tournament) => void;
  tournamentId?: string;
}

const statusOptions = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'REGISTRATION_OPEN', label: 'Registration Open' },
  { value: 'REGISTRATION_CLOSED', label: 'Registration Closed' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export function TournamentInfoEditor({
  tournament,
  onUpdate,
  tournamentId,
}: TournamentInfoEditorProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Tournament>(tournament);

  // Use tournamentId prop or fallback to tournament.id
  const currentTournamentId = tournamentId || tournament.id;

  // Sync formData with tournament prop
  useEffect(() => {
    setFormData(tournament);
  }, [tournament]);

  // Load countries for country selection
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch('/api/v1/countries', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setCountries(data.countries || []);
        }
      } catch (error) {
        console.error('Error fetching countries:', error);
      } finally {
        setIsLoadingCountries(false);
      }
    };

    fetchCountries();
  }, []);

  const updateTournament = async (field: string, value: any) => {
    try {
      const response = await fetch(`/api/v1/tournaments/${tournament.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ [field]: value }),
      });

      if (response.ok) {
        const updatedTournament = await response.json();
        onUpdate(updatedTournament);
        return updatedTournament;
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update tournament');
      }
    } catch (error) {
      console.error('Error updating tournament:', error);
      throw error;
    }
  };

  const countryOptions = countries.map((country) => ({
    value: country.id,
    label: country.name,
  }));

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData(tournament);
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Only send the fields that can be updated, excluding nested objects and read-only fields
      const updateData: any = {
        name: formData.name,
        description: formData.description,
        season: formData.season,
        startDate: formData.startDate
          ? new Date(formData.startDate).toISOString()
          : undefined,
        endDate: formData.endDate
          ? new Date(formData.endDate).toISOString()
          : undefined,
        countryId: formData.country?.id || null,
        city: formData.city || null,
        address: formData.address || null,
        contactEmail: formData.contactEmail || null,
        contactPhone: formData.contactPhone || null,
        status: formData.status,
        autoAcceptTeams: formData.autoAcceptTeams,
        allowWaitlist: formData.allowWaitlist,
      };

      // Only include optional fields if they have values
      if (formData.registrationDeadline) {
        updateData.registrationDeadline = new Date(
          formData.registrationDeadline
        ).toISOString();
      }
      if (formData.maxTeams !== null && formData.maxTeams !== undefined) {
        updateData.maxTeams = formData.maxTeams;
      }
      if (formData.logo) {
        updateData.logo = formData.logo;
      }
      if (formData.heroImage) {
        updateData.heroImage = formData.heroImage;
      }

      console.log('Sending tournament update data:', updateData);

      const response = await fetch(`/api/v1/tournaments/${tournament.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const updatedTournament = await response.json();
        onUpdate(updatedTournament);
        setIsEditing(false);
      } else {
        const error = await response.json();
        console.error('Tournament update failed:', {
          status: response.status,
          statusText: response.statusText,
          error: error,
        });
        throw new Error(
          error.error || `Failed to update tournament (${response.status})`
        );
      }
    } catch (error) {
      console.error('Error updating tournament:', error);
      // You might want to show a toast error here
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => {
      if (field === 'countryId') {
        // Find the country object and update it
        const selectedCountry = countries.find(
          (country) => country.id === value
        );
        return {
          ...prev,
          country: selectedCountry || prev.country,
        };
      }
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const formatDateTimeForInput = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Convert to local datetime-local format
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60000);
    return localDate.toISOString().slice(0, 16);
  };

  return (
    <div className="space-y-4">
      {/* Header with Edit/Save/Cancel buttons */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tournament Information</h2>
        <div className="flex items-center space-x-2">
          {!isEditing ? (
            <Button onClick={handleEdit} size="sm" variant="outline">
              <Edit2 className="mr-2 h-4 w-4" />
              Edit
            </Button>
          ) : (
            <>
              <Button
                onClick={handleCancel}
                size="sm"
                variant="outline"
                disabled={isSaving}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={handleSave} size="sm" disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tournament Information */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 border-b pb-2">
          <Trophy className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Basic Information</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {isEditing ? (
            <>
              <div className="space-y-1">
                <Label htmlFor="name" className="text-sm font-medium">
                  Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter tournament name"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="season" className="text-sm font-medium">
                  Season *
                </Label>
                <Input
                  id="season"
                  type="number"
                  value={formData.season}
                  onChange={(e) => handleInputChange('season', e.target.value)}
                  placeholder="2024"
                  min={2020}
                  max={2030}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="status" className="text-sm font-medium">
                  Status *
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description
                </Label>
                <RichTextEditor
                  content={formData.description || ''}
                  onChange={(content) =>
                    handleInputChange('description', content)
                  }
                  placeholder="Enter tournament description..."
                  className="min-h-[120px]"
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">
                  Name
                </Label>
                <p className="text-sm">{tournament.name}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">
                  Season
                </Label>
                <p className="text-sm">{tournament.season}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">
                  Status
                </Label>
                <p className="text-sm">
                  {
                    statusOptions.find((opt) => opt.value === tournament.status)
                      ?.label
                  }
                </p>
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Description
                </Label>
                {tournament.description ? (
                  <SafeHtml
                    content={tournament.description}
                    className="text-sm"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No description
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Location & Contact */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 border-b pb-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Location & Contact</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {isEditing ? (
            <>
              <div className="space-y-1">
                <Label htmlFor="country" className="text-sm font-medium">
                  Country *
                </Label>
                <Select
                  value={formData.country.id}
                  onValueChange={(value) =>
                    handleInputChange('countryId', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        isLoadingCountries ? 'Loading...' : 'Select country'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {countryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="city" className="text-sm font-medium">
                  City
                </Label>
                <Input
                  id="city"
                  value={formData.city || ''}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Enter city name"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="address" className="text-sm font-medium">
                  Address
                </Label>
                <Input
                  id="address"
                  value={formData.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter full address"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="contactEmail" className="text-sm font-medium">
                  Contact Email
                </Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail || ''}
                  onChange={(e) =>
                    handleInputChange('contactEmail', e.target.value)
                  }
                  placeholder="Enter contact email"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="contactPhone" className="text-sm font-medium">
                  Contact Phone
                </Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  value={formData.contactPhone || ''}
                  onChange={(e) =>
                    handleInputChange('contactPhone', e.target.value)
                  }
                  placeholder="Enter contact phone"
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">
                  Country
                </Label>
                <p className="text-sm">{tournament.country.name}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">
                  City
                </Label>
                <p className="text-sm">{tournament.city || 'Not set'}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">
                  Address
                </Label>
                <p className="text-sm">{tournament.address || 'Not set'}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">
                  Contact Email
                </Label>
                <p className="text-sm">
                  {tournament.contactEmail || 'Not set'}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">
                  Contact Phone
                </Label>
                <p className="text-sm">
                  {tournament.contactPhone || 'Not set'}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tournament Dates */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 border-b pb-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Tournament Dates</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {isEditing ? (
            <>
              <div className="space-y-1">
                <Label htmlFor="startDate" className="text-sm font-medium">
                  Start Date *
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formatDateForInput(formData.startDate) || ''}
                  onChange={(e) =>
                    handleInputChange('startDate', e.target.value)
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="endDate" className="text-sm font-medium">
                  End Date *
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formatDateForInput(formData.endDate) || ''}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor="registrationDeadline"
                  className="text-sm font-medium"
                >
                  Registration Deadline
                </Label>
                <Input
                  id="registrationDeadline"
                  type="datetime-local"
                  value={
                    formData.registrationDeadline
                      ? formatDateTimeForInput(formData.registrationDeadline)
                      : ''
                  }
                  onChange={(e) =>
                    handleInputChange('registrationDeadline', e.target.value)
                  }
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">
                  Start Date
                </Label>
                <p className="text-sm">
                  {new Date(tournament.startDate).toLocaleDateString()}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">
                  End Date
                </Label>
                <p className="text-sm">
                  {new Date(tournament.endDate).toLocaleDateString()}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">
                  Registration Deadline
                </Label>
                <p className="text-sm">
                  {tournament.registrationDeadline
                    ? new Date(tournament.registrationDeadline).toLocaleString()
                    : 'Not set'}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Registration Settings */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 border-b pb-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Registration Settings</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {isEditing ? (
            <>
              <div className="space-y-1">
                <Label htmlFor="maxTeams" className="text-sm font-medium">
                  Maximum Teams
                </Label>
                <Input
                  id="maxTeams"
                  type="number"
                  value={formData.maxTeams || ''}
                  onChange={(e) =>
                    handleInputChange(
                      'maxTeams',
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  placeholder="Enter maximum number of teams"
                  min={1}
                  max={1000}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="autoAcceptTeams"
                  checked={formData.autoAcceptTeams || false}
                  onCheckedChange={(checked) =>
                    handleInputChange('autoAcceptTeams', checked)
                  }
                />
                <Label
                  htmlFor="autoAcceptTeams"
                  className="text-sm font-medium"
                >
                  Auto Accept Teams
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="allowWaitlist"
                  checked={formData.allowWaitlist || false}
                  onCheckedChange={(checked) =>
                    handleInputChange('allowWaitlist', checked)
                  }
                />
                <Label htmlFor="allowWaitlist" className="text-sm font-medium">
                  Allow Waitlist
                </Label>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">
                  Maximum Teams
                </Label>
                <p className="text-sm">{tournament.maxTeams || 'No limit'}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">
                  Auto Accept Teams
                </Label>
                <p className="text-sm">
                  {tournament.autoAcceptTeams ? 'Yes' : 'No'}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">
                  Allow Waitlist
                </Label>
                <p className="text-sm">
                  {tournament.allowWaitlist ? 'Yes' : 'No'}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Media */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 border-b pb-2">
          <Image className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Media</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {isEditing ? (
            <>
              <div className="space-y-1">
                <Label className="text-sm font-medium">Logo</Label>
                <InlineEditImage
                  label=""
                  value={formData.logo || ''}
                  onSave={(value) => handleInputChange('logo', value)}
                  aspectRatio="square"
                  className="space-y-0"
                  uploadType="tournament-logo"
                  tournamentId={currentTournamentId}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium">Hero Image</Label>
                <InlineEditImage
                  label=""
                  value={formData.heroImage || ''}
                  onSave={(value) => handleInputChange('heroImage', value)}
                  aspectRatio="video"
                  className="space-y-0"
                  uploadType="tournament-hero"
                  tournamentId={currentTournamentId}
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">
                  Logo
                </Label>
                <div className="aspect-square rounded border p-2">
                  {tournament.logo ? (
                    <img
                      src={tournament.logo}
                      alt="Tournament logo"
                      className="h-full w-full rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-24 flex-col items-center justify-center text-muted-foreground">
                      <Image className="mb-2 h-8 w-8" />
                      <span className="text-sm">No logo</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">
                  Hero Image
                </Label>
                <div className="aspect-video rounded border p-2">
                  {tournament.heroImage ? (
                    <img
                      src={tournament.heroImage}
                      alt="Tournament hero image"
                      className="h-full w-full rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-24 flex-col items-center justify-center text-muted-foreground">
                      <Image className="mb-2 h-8 w-8" />
                      <span className="text-sm">No hero image</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
