'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Plus, Search, Building2 } from 'lucide-react';
import Image from 'next/image';

interface Club {
  id: string;
  name: string;
  shortName?: string;
  logo?: string;
  city?: string;
  country: {
    id: string;
    name: string;
    code: string;
  };
}

interface ClubSelectionProps {
  selectedClubId: string;
  clubSelectionType: 'existing' | 'new';
  onClubChange: (clubId: string) => void;
  onClubTypeChange: (type: 'existing' | 'new') => void;
  onNewClubDataChange: (data: {
    name: string;
    shortName: string;
    city: string;
    logo: string;
  }) => void;
  newClubData: { name: string; shortName: string; city: string; logo: string };
  errors?: Record<string, string>;
}

export function ClubSelection({
  selectedClubId,
  clubSelectionType,
  onClubChange,
  onClubTypeChange,
  onNewClubDataChange,
  newClubData,
  errors = {},
}: ClubSelectionProps) {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  // Fetch clubs on component mount
  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async (search = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('limit', '20');

      const response = await fetch(`/api/v1/clubs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setClubs(data.clubs || []);
      }
    } catch (error) {
      console.error('Error fetching clubs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    fetchClubs(value);
  };

  const handleLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      setLogoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setLogoPreview(result);
      };
      reader.readAsDataURL(file);

      // Upload to server and get URL
      try {
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);
        uploadFormData.append('type', 'club-logo');
        uploadFormData.append('clubId', 'temp'); // Temporary ID for new clubs

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        if (response.ok) {
          const uploadResult = await response.json();
          onNewClubDataChange({
            ...newClubData,
            logo: uploadResult.url, // Store the Azure Storage URL
          });
        } else {
          console.error('Upload failed');
          alert('Failed to upload logo');
        }
      } catch (error) {
        console.error('Upload error:', error);
        alert('Failed to upload logo');
      }
    }
  };

  const handleNewClubDataChange = (field: string, value: string) => {
    onNewClubDataChange({
      ...newClubData,
      [field]: value,
    });
  };

  return (
    <div className="space-y-6">
      {/* Club Selection Type */}
      <div className="space-y-4">
        <Label>Club Selection</Label>
        <div className="flex gap-4">
          <Button
            type="button"
            variant={clubSelectionType === 'existing' ? 'default' : 'outline'}
            onClick={() => onClubTypeChange('existing')}
            className="flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            Select Existing Club
          </Button>
          <Button
            type="button"
            variant={clubSelectionType === 'new' ? 'default' : 'outline'}
            onClick={() => onClubTypeChange('new')}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add New Club
          </Button>
        </div>
      </div>

      {clubSelectionType === 'existing' ? (
        /* Existing Club Selection */
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="club-search">Search Clubs</Label>
            <Input
              id="club-search"
              placeholder="Search for club name, city, or abbreviation..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="py-4 text-center">Loading clubs...</div>
          ) : (
            <div className="grid max-h-60 gap-3 overflow-y-auto">
              {clubs.map((club) => (
                <Card
                  key={club.id}
                  className={`cursor-pointer transition-colors ${
                    selectedClubId === club.id
                      ? 'bg-blue-50 ring-2 ring-blue-500'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => onClubChange(club.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {club.logo ? (
                        <Image
                          src={club.logo}
                          alt={`${club.name} logo`}
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                          <Building2 className="h-5 w-5 text-gray-500" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{club.name}</div>
                        <div className="text-sm text-gray-600">
                          {club.city && `${club.city}, `}
                          {club.country.name}
                        </div>
                        {club.shortName && (
                          <Badge variant="secondary" className="text-xs">
                            {club.shortName}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {clubs.length === 0 && !loading && (
                <div className="py-4 text-center text-gray-500">
                  No clubs found. Try a different search term.
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* New Club Form */
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-club-name">Club Name *</Label>
              <Input
                id="new-club-name"
                value={newClubData.name}
                onChange={(e) =>
                  handleNewClubDataChange('name', e.target.value)
                }
                placeholder="e.g., Helsinki Football Club"
                className={errors.newClubName ? 'border-red-500' : ''}
              />
              {errors.newClubName && (
                <div className="text-sm text-red-600">{errors.newClubName}</div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-club-short">Abbreviation</Label>
              <Input
                id="new-club-short"
                value={newClubData.shortName}
                onChange={(e) =>
                  handleNewClubDataChange('shortName', e.target.value)
                }
                placeholder="e.g., HFC"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-club-city">City</Label>
            <Input
              id="new-club-city"
              value={newClubData.city}
              onChange={(e) => handleNewClubDataChange('city', e.target.value)}
              placeholder="e.g., Helsinki"
            />
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>Club Logo</Label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="club-logo-upload"
                />
                <Label
                  htmlFor="club-logo-upload"
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50"
                >
                  <Upload className="h-4 w-4" />
                  Upload Logo
                </Label>
              </div>
              {logoPreview && (
                <div className="flex items-center gap-2">
                  <Image
                    src={logoPreview}
                    alt="Logo preview"
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                  <span className="text-sm text-gray-600">Logo selected</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Recommended size: 200x200px. Supported formats: JPG, PNG, GIF
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
