'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MainNavigation } from '@/components/navigation/main-navigation';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Building2,
  MapPin,
  Globe,
  Calendar,
} from 'lucide-react';
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
  website?: string;
  description?: string;
  foundedYear?: number;
  _count: {
    teams: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface Country {
  id: string;
  name: string;
  code: string;
}

export default function ClubsManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    city: '',
    countryId: '',
    website: '',
    description: '',
    foundedYear: '',
    logo: '',
  });

  // Check authentication and admin role
  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user) {
      router.push('/auth/signin');
      return;
    }

    const user = session.user as any;
    if (user.role !== 'ADMIN') {
      router.push('/');
      return;
    }
  }, [session, status, router]);

  // Fetch clubs and countries
  useEffect(() => {
    if (session?.user) {
      fetchClubs();
      fetchCountries();
    }
  }, [session]);

  const fetchClubs = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCountry) params.append('countryId', selectedCountry);

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

  const fetchCountries = async () => {
    try {
      const response = await fetch('/api/v1/countries');
      if (response.ok) {
        const data = await response.json();
        setCountries(data.countries || []);
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
    }
  };

  const handleCreateClub = async () => {
    try {
      const response = await fetch('/api/v1/clubs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          foundedYear: formData.foundedYear
            ? parseInt(formData.foundedYear)
            : null,
        }),
      });

      if (response.ok) {
        setIsCreateDialogOpen(false);
        setFormData({
          name: '',
          shortName: '',
          city: '',
          countryId: '',
          website: '',
          description: '',
          foundedYear: '',
          logo: '',
        });
        fetchClubs();
      } else {
        const error = await response.json();
        alert(`Error creating club: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating club:', error);
      alert('Error creating club');
    }
  };

  const handleEditClub = async () => {
    if (!editingClub) return;

    try {
      const response = await fetch(`/api/v1/clubs/${editingClub.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          foundedYear: formData.foundedYear
            ? parseInt(formData.foundedYear)
            : null,
        }),
      });

      if (response.ok) {
        setIsEditDialogOpen(false);
        setEditingClub(null);
        setFormData({
          name: '',
          shortName: '',
          city: '',
          countryId: '',
          website: '',
          description: '',
          foundedYear: '',
          logo: '',
        });
        fetchClubs();
      } else {
        const error = await response.json();
        alert(`Error updating club: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating club:', error);
      alert('Error updating club');
    }
  };

  const handleDeleteClub = async (clubId: string) => {
    if (!confirm('Are you sure you want to delete this club?')) return;

    try {
      const response = await fetch(`/api/v1/clubs/${clubId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchClubs();
      } else {
        const error = await response.json();
        alert(`Error deleting club: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting club:', error);
      alert('Error deleting club');
    }
  };

  const openEditDialog = (club: Club) => {
    setEditingClub(club);
    setFormData({
      name: club.name,
      shortName: club.shortName || '',
      city: club.city || '',
      countryId: club.country.id,
      website: club.website || '',
      description: club.description || '',
      foundedYear: club.foundedYear?.toString() || '',
      logo: club.logo || '',
    });
    setIsEditDialogOpen(true);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MainNavigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Club Management</h1>
          <p className="text-gray-600">Manage football clubs in the system</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search clubs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Countries</SelectItem>
              {countries.map((country) => (
                <SelectItem key={country.id} value={country.id}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={fetchClubs}>Search</Button>
        </div>

        {/* Create Club Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mb-6">
              <Plus className="mr-2 h-4 w-4" />
              Add New Club
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Club</DialogTitle>
              <DialogDescription>
                Add a new football club to the system
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Club Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="e.g., Helsinki Football Club"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shortName">Abbreviation</Label>
                  <Input
                    id="shortName"
                    value={formData.shortName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        shortName: e.target.value,
                      }))
                    }
                    placeholder="e.g., HFC"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, city: e.target.value }))
                    }
                    placeholder="e.g., Helsinki"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="countryId">Country *</Label>
                  <Select
                    value={formData.countryId}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, countryId: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.id} value={country.id}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      website: e.target.value,
                    }))
                  }
                  placeholder="https://example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Club description..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="foundedYear">Founded Year</Label>
                <Input
                  id="foundedYear"
                  type="number"
                  value={formData.foundedYear}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      foundedYear: e.target.value,
                    }))
                  }
                  placeholder="e.g., 1907"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logo">Logo URL</Label>
                <Input
                  id="logo"
                  value={formData.logo}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, logo: e.target.value }))
                  }
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateClub}>Create Club</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Club Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Club</DialogTitle>
              <DialogDescription>Update club information</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Club Name *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="e.g., Helsinki Football Club"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-shortName">Abbreviation</Label>
                  <Input
                    id="edit-shortName"
                    value={formData.shortName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        shortName: e.target.value,
                      }))
                    }
                    placeholder="e.g., HFC"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-city">City</Label>
                  <Input
                    id="edit-city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, city: e.target.value }))
                    }
                    placeholder="e.g., Helsinki"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-countryId">Country *</Label>
                  <Select
                    value={formData.countryId}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, countryId: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.id} value={country.id}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-website">Website</Label>
                <Input
                  id="edit-website"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      website: e.target.value,
                    }))
                  }
                  placeholder="https://example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Club description..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-foundedYear">Founded Year</Label>
                <Input
                  id="edit-foundedYear"
                  type="number"
                  value={formData.foundedYear}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      foundedYear: e.target.value,
                    }))
                  }
                  placeholder="e.g., 1907"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-logo">Logo URL</Label>
                <Input
                  id="edit-logo"
                  value={formData.logo}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, logo: e.target.value }))
                  }
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleEditClub}>Update Club</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Clubs List */}
        <div className="grid gap-4">
          {clubs.map((club) => (
            <Card key={club.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {club.logo ? (
                      <Image
                        src={club.logo}
                        alt={`${club.name} logo`}
                        width={60}
                        height={60}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-15 h-15 flex items-center justify-center rounded-full bg-gray-200">
                        <Building2 className="h-8 w-8 text-gray-500" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold">{club.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {club.shortName && (
                          <Badge variant="secondary">{club.shortName}</Badge>
                        )}
                        {club.city && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {club.city}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Globe className="h-4 w-4" />
                          {club.country.name}
                        </div>
                        {club.foundedYear && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {club.foundedYear}
                          </div>
                        )}
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        {club._count.teams} teams registered
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(club)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClub(club.id)}
                      disabled={club._count.teams > 0}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {clubs.length === 0 && !loading && (
          <div className="py-8 text-center text-gray-500">
            No clubs found. Try adjusting your search criteria.
          </div>
        )}
      </div>
    </div>
  );
}
