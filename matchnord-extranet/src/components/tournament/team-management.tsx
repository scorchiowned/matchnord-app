'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  CheckCircle,
  XCircle,
  Clock,
  Users,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Trophy,
  Eye,
  RefreshCw,
  Edit,
  Save,
  X,
  Upload,
  Search,
  Building2,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface Team {
  id: string;
  name: string;
  logo?: string;
  club?: string;
  clubRef?: {
    id: string;
    name: string;
    logo?: string;
  };
  city?: string;
  country?: {
    id: string;
    name: string;
    code: string;
  };
  countryId?: string;
  level?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'WAITLISTED';
  isWaitlisted: boolean;
  submittedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  notes?: string;
  // Contact person details
  contactFirstName?: string;
  contactLastName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  contactPostalCode?: string;
  contactCity?: string;
  // Billing address (optional)
  billingName?: string;
  billingAddress?: string;
  billingPostalCode?: string;
  billingCity?: string;
  billingEmail?: string;
  division?: {
    id: string;
    name: string;
    level?: string;
  };
  manager?: {
    id: string;
    name: string;
    email: string;
  };
  payments?: Array<{
    amount: number;
    status: string;
    method?: string;
  }>;
}

interface Country {
  id: string;
  name: string;
  code: string;
}

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

interface TeamManagementProps {
  tournamentId: string;
  onTeamsChange?: (teams: Team[]) => void;
}

export function TeamManagement({
  tournamentId,
  onTeamsChange,
}: TeamManagementProps) {
  const { data: session } = useSession();
  const user = session?.user as any;
  const isAdmin = user?.role === 'ADMIN';

  const [teams, setTeams] = useState<Team[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isAddTeamDialogOpen, setIsAddTeamDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Club selection state
  const [clubSearchTerm, setClubSearchTerm] = useState('');
  const [clubSelectionType, setClubSelectionType] = useState<
    'existing' | 'custom'
  >('existing');
  const [isLoadingClubs, setIsLoadingClubs] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    clubId: '',
    club: '',
    city: '',
    countryId: '',
    level: '',
    contactFirstName: '',
    contactLastName: '',
    contactEmail: '',
    contactPhone: '',
    contactAddress: '',
    contactPostalCode: '',
    contactCity: '',
    billingName: '',
    billingAddress: '',
    billingPostalCode: '',
    billingCity: '',
    billingEmail: '',
  });

  // Fetch teams and countries
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch teams
        const teamsResponse = await fetch(
          `/api/v1/tournaments/${tournamentId}/registrations`,
          {
            credentials: 'include',
          }
        );

        if (teamsResponse.ok) {
          const teamsData = await teamsResponse.json();
          setTeams(teamsData);
          onTeamsChange?.(teamsData);
        } else {
          toast.error('Failed to load teams');
        }

        // Fetch countries
        const countriesResponse = await fetch('/api/v1/countries', {
          credentials: 'include',
        });

        if (countriesResponse.ok) {
          const countriesData = await countriesResponse.json();
          setCountries(countriesData.countries || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [tournamentId, onTeamsChange]);

  const getStatusBadge = (status: string, isWaitlisted: boolean) => {
    if (isWaitlisted) {
      return <Badge variant="secondary">Waitlisted</Badge>;
    }

    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>;
      case 'WAITLISTED':
        return <Badge variant="secondary">Waitlisted</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'CANCELLED':
        return <XCircle className="h-4 w-4 text-gray-600" />;
      case 'WAITLISTED':
        return <Clock className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  // Fetch clubs with search
  const fetchClubs = async (search = '') => {
    setIsLoadingClubs(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (formData.countryId) params.append('countryId', formData.countryId);
      params.append('limit', '20');

      const response = await fetch(`/api/v1/clubs?${params}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setClubs(data.clubs || []);
      } else {
        console.error(
          'Error fetching clubs:',
          response.status,
          response.statusText
        );
        const errorData = await response.json().catch(() => ({}));
        console.error('Error details:', errorData);
        setClubs([]);
      }
    } catch (error) {
      console.error('Error fetching clubs:', error);
      setClubs([]);
    } finally {
      setIsLoadingClubs(false);
    }
  };

  // Handle club search
  useEffect(() => {
    if (clubSearchTerm || formData.countryId) {
      const timeoutId = setTimeout(() => {
        fetchClubs(clubSearchTerm);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setClubs([]);
    }
  }, [clubSearchTerm, formData.countryId]);

  const handleEdit = (team: Team) => {
    setSelectedTeam(team);
    const clubId = team.clubRef?.id || '';
    const clubName = team.club || team.clubRef?.name || '';

    setFormData({
      name: team.name || '',
      logo: team.logo || team.clubRef?.logo || '',
      clubId: clubId,
      club: clubName,
      city: team.city || '',
      countryId: team.countryId || team.country?.id || '',
      level: team.level || '',
      contactFirstName: team.contactFirstName || '',
      contactLastName: team.contactLastName || '',
      contactEmail: team.contactEmail || '',
      contactPhone: team.contactPhone || '',
      contactAddress: team.contactAddress || '',
      contactPostalCode: team.contactPostalCode || '',
      contactCity: team.contactCity || '',
      billingName: team.billingName || '',
      billingAddress: team.billingAddress || '',
      billingPostalCode: team.billingPostalCode || '',
      billingCity: team.billingCity || '',
      billingEmail: team.billingEmail || '',
    });

    // Set club selection type
    if (clubId) {
      setClubSelectionType('existing');
      fetchClubs(); // Load clubs to show selected one
    } else if (clubName) {
      setClubSelectionType('custom');
    } else {
      setClubSelectionType('existing');
    }

    setIsEditing(true);
    setIsDetailDialogOpen(true);
  };

  // Handle club selection
  const handleClubSelect = (clubId: string) => {
    const selectedClub = clubs.find((c) => c.id === clubId);
    if (selectedClub) {
      setFormData({
        ...formData,
        clubId: selectedClub.id,
        club: selectedClub.name,
        logo: selectedClub.logo || formData.logo, // Inherit logo from club, keep existing if club has no logo
      });
      toast.success(
        `Selected club: ${selectedClub.name}${selectedClub.logo ? ' (logo inherited)' : ''}`
      );
    }
  };

  // Handle custom club name change
  const handleCustomClubChange = (clubName: string) => {
    setFormData({
      ...formData,
      clubId: '', // Clear clubId when using custom
      club: clubName,
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setClubSearchTerm('');
    setClubSelectionType('existing');
    setFormData({
      name: '',
      logo: '',
      clubId: '',
      club: '',
      city: '',
      countryId: '',
      level: '',
      contactFirstName: '',
      contactLastName: '',
      contactEmail: '',
      contactPhone: '',
      contactAddress: '',
      contactPostalCode: '',
      contactCity: '',
      billingName: '',
      billingAddress: '',
      billingPostalCode: '',
      billingCity: '',
      billingEmail: '',
    });
  };

  const handleLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    try {
      setIsUploadingLogo(true);
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('type', 'team-logo');
      uploadFormData.append('teamId', selectedTeam?.id || '');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
        credentials: 'include',
      });

      if (response.ok) {
        const uploadResult = await response.json();
        setFormData({ ...formData, logo: uploadResult.url });
        toast.success('Logo uploaded successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to upload logo');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    if (!selectedTeam) return;

    if (!formData.name || !formData.countryId) {
      toast.error('Name and country are required');
      return;
    }

    try {
      setIsUpdating(true);
      const updateData = {
        ...formData,
        // Only send clubId if an existing club is selected, otherwise send club name
        clubId: formData.clubId || undefined,
        club: formData.clubId ? undefined : formData.club, // Don't send club name if clubId is set
      };

      const response = await fetch(`/api/v1/teams/${selectedTeam.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const updatedTeam = await response.json();
        setTeams((prevTeams) =>
          prevTeams.map((team) =>
            team.id === selectedTeam.id ? updatedTeam : team
          )
        );
        onTeamsChange?.(
          teams.map((team) =>
            team.id === selectedTeam.id ? updatedTeam : team
          )
        );
        toast.success('Team updated successfully');
        setIsEditing(false);
        setSelectedTeam(updatedTeam);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update team');
      }
    } catch (error) {
      console.error('Error updating team:', error);
      toast.error('Failed to update team');
    } finally {
      setIsUpdating(false);
    }
  };

  const updateTeamStatus = async (
    teamId: string,
    status: string,
    notes?: string
  ) => {
    try {
      setIsUpdating(true);
      const response = await fetch(`/api/v1/registrations/${teamId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status, notes }),
      });

      if (response.ok) {
        const updatedTeam = await response.json();
        setTeams((prevTeams) =>
          prevTeams.map((team) => (team.id === teamId ? updatedTeam : team))
        );
        onTeamsChange?.(
          teams.map((team) => (team.id === teamId ? updatedTeam : team))
        );
        toast.success(`Team ${status.toLowerCase()} successfully`);
        setIsDetailDialogOpen(false);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update team status');
      }
    } catch (error) {
      console.error('Error updating team status:', error);
      toast.error('Failed to update team status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedTeams.length === 0) {
      toast.error('Please select teams to update');
      return;
    }

    try {
      setIsUpdating(true);
      const promises = selectedTeams.map((teamId) =>
        updateTeamStatus(teamId, status)
      );
      await Promise.all(promises);
      setSelectedTeams([]);
      toast.success(
        `Updated ${selectedTeams.length} teams to ${status.toLowerCase()}`
      );
    } catch (error) {
      console.error('Error updating team statuses:', error);
      toast.error('Failed to update team statuses');
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredTeams = teams.filter((team) => {
    if (statusFilter === 'ALL') {
      // Show all teams including rejected ones
      return true;
    }
    if (statusFilter === 'ACTIVE') {
      // Show only approved teams (the ones actually participating)
      return team.status === 'APPROVED';
    }
    if (statusFilter === 'WAITLISTED') return team.isWaitlisted;
    if (statusFilter === 'REJECTED') return team.status === 'REJECTED';
    return team.status === statusFilter;
  });

  const statusCounts = {
    total: teams.length,
    pending: teams.filter((t) => t.status === 'PENDING').length,
    approved: teams.filter((t) => t.status === 'APPROVED').length,
    rejected: teams.filter((t) => t.status === 'REJECTED').length,
    waitlisted: teams.filter((t) => t.isWaitlisted).length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading teams...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Card className="border-0 shadow-none">
          <CardContent className="border-0 p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div className="border-0 ">
                <p className="text-sm font-medium">Total</p>
                <p className="text-2xl font-bold">{statusCounts.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold">{statusCounts.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Approved</p>
                <p className="text-2xl font-bold">{statusCounts.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm font-medium">Rejected</p>
                <p className="text-2xl font-bold">{statusCounts.rejected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Waitlisted</p>
                <p className="text-2xl font-bold">{statusCounts.waitlisted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="border-0 shadow-none">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Teams & Registrations</CardTitle>
              {/* <CardDescription>
                Manage team registrations and approvals. Use filters to view
                different team statuses.
              </CardDescription> */}
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Teams</SelectItem>
                  <SelectItem value="ACTIVE">Active Teams</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="WAITLISTED">Waitlisted</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Dialog
                open={isAddTeamDialogOpen}
                onOpenChange={setIsAddTeamDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Team
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Team</DialogTitle>
                    <DialogDescription>
                      Create a new team directly in this tournament
                    </DialogDescription>
                  </DialogHeader>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!formData.name || !formData.countryId) {
                        toast.error('Name and country are required');
                        return;
                      }

                      try {
                        setIsSubmitting(true);
                        const response = await fetch(
                          `/api/v1/tournaments/${tournamentId}/teams`,
                          {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            credentials: 'include',
                            body: JSON.stringify({
                              name: formData.name,
                              shortName: formData.name
                                .substring(0, 3)
                                .toUpperCase(),
                              club: formData.club || undefined,
                              clubId: formData.clubId || undefined,
                              city: formData.city || undefined,
                              countryId: formData.countryId,
                              level: formData.level || undefined,
                            }),
                          }
                        );

                        if (response.ok) {
                          const newTeam = await response.json();
                          // Refresh teams list
                          const teamsResponse = await fetch(
                            `/api/v1/tournaments/${tournamentId}/registrations`,
                            {
                              credentials: 'include',
                            }
                          );
                          if (teamsResponse.ok) {
                            const teamsData = await teamsResponse.json();
                            setTeams(teamsData);
                            onTeamsChange?.(teamsData);
                          }
                          toast.success('Team added successfully');
                          setIsAddTeamDialogOpen(false);
                          // Reset form
                          setFormData({
                            name: '',
                            logo: '',
                            clubId: '',
                            club: '',
                            city: '',
                            countryId: '',
                            level: '',
                            contactFirstName: '',
                            contactLastName: '',
                            contactEmail: '',
                            contactPhone: '',
                            contactAddress: '',
                            contactPostalCode: '',
                            contactCity: '',
                            billingName: '',
                            billingAddress: '',
                            billingPostalCode: '',
                            billingCity: '',
                            billingEmail: '',
                          });
                          setClubSelectionType('existing');
                          setClubSearchTerm('');
                        } else {
                          const error = await response.json();
                          toast.error(error.error || 'Failed to add team');
                        }
                      } catch (error) {
                        console.error('Error adding team:', error);
                        toast.error('Failed to add team');
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>
                          Team Name * <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label>
                          Country * <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={formData.countryId}
                          onValueChange={(value) =>
                            setFormData({ ...formData, countryId: value })
                          }
                          required
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
                      <div>
                        <Label>City</Label>
                        <Input
                          value={formData.city}
                          onChange={(e) =>
                            setFormData({ ...formData, city: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label>Level</Label>
                        <Input
                          value={formData.level}
                          onChange={(e) =>
                            setFormData({ ...formData, level: e.target.value })
                          }
                          placeholder="e.g., Elite, Competitive"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Club</Label>
                      <div className="mt-1 space-y-2">
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={
                              clubSelectionType === 'existing'
                                ? 'default'
                                : 'outline'
                            }
                            size="sm"
                            onClick={() => setClubSelectionType('existing')}
                          >
                            <Search className="mr-2 h-4 w-4" />
                            Existing
                          </Button>
                          <Button
                            type="button"
                            variant={
                              clubSelectionType === 'custom'
                                ? 'default'
                                : 'outline'
                            }
                            size="sm"
                            onClick={() => {
                              setClubSelectionType('custom');
                              setFormData({ ...formData, clubId: '' });
                            }}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Custom
                          </Button>
                        </div>
                        {clubSelectionType === 'existing' ? (
                          <div className="space-y-2">
                            <Input
                              placeholder="Search clubs..."
                              value={clubSearchTerm}
                              onChange={(e) =>
                                setClubSearchTerm(e.target.value)
                              }
                            />
                            {isLoadingClubs ? (
                              <div className="py-2 text-center text-sm text-muted-foreground">
                                Loading clubs...
                              </div>
                            ) : clubs.length > 0 ? (
                              <div className="max-h-40 overflow-y-auto rounded-md border">
                                {clubs.map((club) => (
                                  <div
                                    key={club.id}
                                    className={`cursor-pointer p-2 hover:bg-gray-50 ${
                                      formData.clubId === club.id
                                        ? 'bg-blue-50'
                                        : ''
                                    }`}
                                    onClick={() => handleClubSelect(club.id)}
                                  >
                                    <div className="flex items-center gap-2">
                                      {club.logo ? (
                                        <Image
                                          src={club.logo}
                                          alt={club.name}
                                          width={24}
                                          height={24}
                                          className="rounded object-cover"
                                        />
                                      ) : (
                                        <Building2 className="h-5 w-5 text-gray-400" />
                                      )}
                                      <div className="flex-1">
                                        <div className="text-sm font-medium">
                                          {club.name}
                                        </div>
                                        {club.city && (
                                          <div className="text-xs text-muted-foreground">
                                            {club.city}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : clubSearchTerm ? (
                              <div className="py-2 text-center text-sm text-muted-foreground">
                                No clubs found. Try a different search term.
                              </div>
                            ) : (
                              <div className="py-2 text-center text-sm text-muted-foreground">
                                Start typing to search clubs...
                              </div>
                            )}
                          </div>
                        ) : (
                          <Input
                            placeholder="Enter club name"
                            value={formData.club}
                            onChange={(e) =>
                              setFormData({ ...formData, club: e.target.value })
                            }
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddTeamDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Adding...' : 'Add Team'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Bulk Actions */}
          {selectedTeams.length > 0 && (
            <div className="mb-4 rounded-lg bg-blue-50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {selectedTeams.length} team(s) selected
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleBulkStatusUpdate('APPROVED')}
                    disabled={isUpdating}
                  >
                    Approve Selected
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleBulkStatusUpdate('REJECTED')}
                    disabled={isUpdating}
                  >
                    Reject Selected
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Teams Table */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 bg-[#489a66] text-white">
                    <Checkbox
                      checked={selectedTeams.length === filteredTeams.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedTeams(filteredTeams.map((t) => t.id));
                        } else {
                          setSelectedTeams([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead className="bg-[#489a66] text-white">
                    Team
                  </TableHead>
                  <TableHead className="bg-[#489a66] text-white">
                    Division
                  </TableHead>
                  <TableHead className="bg-[#489a66] text-white">
                    Contact
                  </TableHead>
                  <TableHead className="bg-[#489a66] text-white">
                    Status
                  </TableHead>
                  <TableHead className="bg-[#489a66] text-white">
                    Submitted
                  </TableHead>
                  <TableHead className="w-12 bg-[#489a66] text-white">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedTeams.includes(team.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTeams([...selectedTeams, team.id]);
                          } else {
                            setSelectedTeams(
                              selectedTeams.filter((id) => id !== team.id)
                            );
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {(team.logo || team.clubRef?.logo) && (
                          <img
                            src={team.logo || team.clubRef?.logo}
                            alt={`${team.name} logo`}
                            className="h-8 w-8 rounded object-cover"
                          />
                        )}
                        <div>
                          <div className="font-medium">{team.name}</div>
                          <div className="text-sm text-gray-500">
                            {(team.club || team.clubRef?.name) &&
                              `${team.club || team.clubRef?.name} • `}
                            {team.city && `${team.city}, `}
                            {team.country?.name}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {team.division?.name || 'No Division'}
                        </div>
                        {team.division?.level && (
                          <div className="text-sm text-gray-500">
                            {team.division.level}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {team.contactFirstName} {team.contactLastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {team.contactEmail}
                        </div>
                        {team.contactPhone && (
                          <div className="text-sm text-gray-500">
                            {team.contactPhone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(team.status)}
                        {getStatusBadge(team.status, team.isWaitlisted)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(team.submittedAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog
                          open={
                            isDetailDialogOpen && selectedTeam?.id === team.id
                          }
                          onOpenChange={(open) => {
                            setIsDetailDialogOpen(open);
                            if (!open) {
                              setIsEditing(false);
                              setSelectedTeam(null);
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedTeam(team);
                                setIsEditing(false);
                                setIsDetailDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
                            <DialogHeader>
                              <div className="flex items-center justify-between">
                                <div>
                                  <DialogTitle>Team Details</DialogTitle>
                                  <DialogDescription>
                                    {isEditing
                                      ? 'Edit team registration details'
                                      : 'View and manage team registration details'}
                                  </DialogDescription>
                                </div>
                                {!isEditing && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEdit(team)}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </Button>
                                )}
                              </div>
                            </DialogHeader>
                            {selectedTeam && (
                              <div className="space-y-6">
                                {isEditing ? (
                                  // Edit Form
                                  <>
                                    {/* Logo Upload - Admin Only */}
                                    {isAdmin && (
                                      <div>
                                        <Label className="text-sm font-medium">
                                          Team Logo
                                        </Label>
                                        <div className="mt-2 flex items-center gap-4">
                                          {formData.logo && (
                                            <img
                                              src={formData.logo}
                                              alt="Team logo"
                                              className="h-20 w-20 rounded object-cover"
                                            />
                                          )}
                                          <div>
                                            <Input
                                              type="file"
                                              accept="image/*"
                                              onChange={handleLogoUpload}
                                              disabled={isUploadingLogo}
                                              className="cursor-pointer"
                                            />
                                            {isUploadingLogo && (
                                              <p className="mt-1 text-xs text-muted-foreground">
                                                Uploading...
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Team Information */}
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label className="text-sm font-medium">
                                          Team Name *
                                        </Label>
                                        <Input
                                          value={formData.name}
                                          onChange={(e) =>
                                            setFormData({
                                              ...formData,
                                              name: e.target.value,
                                            })
                                          }
                                          className="mt-1"
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">
                                          Club
                                        </Label>
                                        <div className="mt-1 space-y-2">
                                          {/* Club Selection Type Toggle */}
                                          <div className="flex gap-2">
                                            <Button
                                              type="button"
                                              variant={
                                                clubSelectionType === 'existing'
                                                  ? 'default'
                                                  : 'outline'
                                              }
                                              size="sm"
                                              onClick={() =>
                                                setClubSelectionType('existing')
                                              }
                                              className="flex items-center gap-2"
                                            >
                                              <Search className="h-4 w-4" />
                                              Existing
                                            </Button>
                                            <Button
                                              type="button"
                                              variant={
                                                clubSelectionType === 'custom'
                                                  ? 'default'
                                                  : 'outline'
                                              }
                                              size="sm"
                                              onClick={() => {
                                                setClubSelectionType('custom');
                                                setFormData({
                                                  ...formData,
                                                  clubId: '',
                                                });
                                              }}
                                              className="flex items-center gap-2"
                                            >
                                              <Plus className="h-4 w-4" />
                                              Custom
                                            </Button>
                                          </div>

                                          {clubSelectionType === 'existing' ? (
                                            <div className="space-y-2">
                                              <Input
                                                placeholder="Search clubs..."
                                                value={clubSearchTerm}
                                                onChange={(e) =>
                                                  setClubSearchTerm(
                                                    e.target.value
                                                  )
                                                }
                                                className="w-full"
                                              />
                                              {isLoadingClubs ? (
                                                <div className="py-2 text-center text-sm text-muted-foreground">
                                                  Loading clubs...
                                                </div>
                                              ) : clubs.length > 0 ? (
                                                <div className="max-h-40 overflow-y-auto rounded-md border">
                                                  {clubs.map((club) => (
                                                    <div
                                                      key={club.id}
                                                      className={`cursor-pointer p-2 hover:bg-gray-50 ${
                                                        formData.clubId ===
                                                        club.id
                                                          ? 'bg-blue-50'
                                                          : ''
                                                      }`}
                                                      onClick={() =>
                                                        handleClubSelect(
                                                          club.id
                                                        )
                                                      }
                                                    >
                                                      <div className="flex items-center gap-2">
                                                        {club.logo ? (
                                                          <Image
                                                            src={club.logo}
                                                            alt={club.name}
                                                            width={24}
                                                            height={24}
                                                            className="rounded object-cover"
                                                          />
                                                        ) : (
                                                          <Building2 className="h-5 w-5 text-gray-400" />
                                                        )}
                                                        <div className="flex-1">
                                                          <div className="text-sm font-medium">
                                                            {club.name}
                                                          </div>
                                                          {club.city && (
                                                            <div className="text-xs text-muted-foreground">
                                                              {club.city}
                                                            </div>
                                                          )}
                                                        </div>
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              ) : clubSearchTerm ? (
                                                <div className="py-2 text-center text-sm text-muted-foreground">
                                                  No clubs found. Try a
                                                  different search term.
                                                </div>
                                              ) : (
                                                <div className="py-2 text-center text-sm text-muted-foreground">
                                                  Start typing to search
                                                  clubs...
                                                </div>
                                              )}
                                              {formData.clubId && (
                                                <div className="text-xs text-muted-foreground">
                                                  Selected: {formData.club}
                                                </div>
                                              )}
                                            </div>
                                          ) : (
                                            <Input
                                              placeholder="Enter custom club name"
                                              value={formData.club}
                                              onChange={(e) =>
                                                handleCustomClubChange(
                                                  e.target.value
                                                )
                                              }
                                              className="mt-1"
                                            />
                                          )}
                                        </div>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">
                                          City
                                        </Label>
                                        <Input
                                          value={formData.city}
                                          onChange={(e) =>
                                            setFormData({
                                              ...formData,
                                              city: e.target.value,
                                            })
                                          }
                                          className="mt-1"
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">
                                          Country *
                                        </Label>
                                        <Select
                                          value={formData.countryId}
                                          onValueChange={(value) => {
                                            setFormData({
                                              ...formData,
                                              countryId: value,
                                            });
                                            // Refresh clubs when country changes
                                            if (
                                              clubSelectionType === 'existing'
                                            ) {
                                              fetchClubs(clubSearchTerm);
                                            }
                                          }}
                                        >
                                          <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Select country" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {countries.map((country) => (
                                              <SelectItem
                                                key={country.id}
                                                value={country.id}
                                              >
                                                {country.name}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">
                                          Level
                                        </Label>
                                        <Input
                                          value={formData.level}
                                          onChange={(e) =>
                                            setFormData({
                                              ...formData,
                                              level: e.target.value,
                                            })
                                          }
                                          className="mt-1"
                                        />
                                      </div>
                                    </div>

                                    {/* Contact Information */}
                                    <div>
                                      <h4 className="mb-3 font-medium">
                                        Contact Information
                                      </h4>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label className="text-sm font-medium">
                                            First Name
                                          </Label>
                                          <Input
                                            value={formData.contactFirstName}
                                            onChange={(e) =>
                                              setFormData({
                                                ...formData,
                                                contactFirstName:
                                                  e.target.value,
                                              })
                                            }
                                            className="mt-1"
                                          />
                                        </div>
                                        <div>
                                          <Label className="text-sm font-medium">
                                            Last Name
                                          </Label>
                                          <Input
                                            value={formData.contactLastName}
                                            onChange={(e) =>
                                              setFormData({
                                                ...formData,
                                                contactLastName: e.target.value,
                                              })
                                            }
                                            className="mt-1"
                                          />
                                        </div>
                                        <div>
                                          <Label className="text-sm font-medium">
                                            Email
                                          </Label>
                                          <Input
                                            type="email"
                                            value={formData.contactEmail}
                                            onChange={(e) =>
                                              setFormData({
                                                ...formData,
                                                contactEmail: e.target.value,
                                              })
                                            }
                                            className="mt-1"
                                          />
                                        </div>
                                        <div>
                                          <Label className="text-sm font-medium">
                                            Phone
                                          </Label>
                                          <Input
                                            type="tel"
                                            value={formData.contactPhone}
                                            onChange={(e) =>
                                              setFormData({
                                                ...formData,
                                                contactPhone: e.target.value,
                                              })
                                            }
                                            className="mt-1"
                                          />
                                        </div>
                                        <div className="col-span-2">
                                          <Label className="text-sm font-medium">
                                            Address
                                          </Label>
                                          <Input
                                            value={formData.contactAddress}
                                            onChange={(e) =>
                                              setFormData({
                                                ...formData,
                                                contactAddress: e.target.value,
                                              })
                                            }
                                            className="mt-1"
                                          />
                                        </div>
                                        <div>
                                          <Label className="text-sm font-medium">
                                            Postal Code
                                          </Label>
                                          <Input
                                            value={formData.contactPostalCode}
                                            onChange={(e) =>
                                              setFormData({
                                                ...formData,
                                                contactPostalCode:
                                                  e.target.value,
                                              })
                                            }
                                            className="mt-1"
                                          />
                                        </div>
                                        <div>
                                          <Label className="text-sm font-medium">
                                            City
                                          </Label>
                                          <Input
                                            value={formData.contactCity}
                                            onChange={(e) =>
                                              setFormData({
                                                ...formData,
                                                contactCity: e.target.value,
                                              })
                                            }
                                            className="mt-1"
                                          />
                                        </div>
                                      </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex justify-end gap-2 border-t pt-4">
                                      <Button
                                        variant="outline"
                                        onClick={() => {
                                          handleCancelEdit();
                                          setIsDetailDialogOpen(false);
                                        }}
                                        disabled={isUpdating}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        onClick={handleSave}
                                        disabled={isUpdating}
                                      >
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Changes
                                      </Button>
                                    </div>
                                  </>
                                ) : (
                                  // Read-only View
                                  <>
                                    {/* Team Information */}
                                    <div className="grid grid-cols-2 gap-4">
                                      {(selectedTeam.logo ||
                                        selectedTeam.clubRef?.logo) && (
                                        <div className="col-span-2">
                                          <Label className="text-sm font-medium">
                                            Logo
                                          </Label>
                                          <img
                                            src={
                                              selectedTeam.logo ||
                                              selectedTeam.clubRef?.logo
                                            }
                                            alt="Team logo"
                                            className="mt-2 h-20 w-20 rounded object-cover"
                                          />
                                        </div>
                                      )}
                                      <div>
                                        <Label className="text-sm font-medium">
                                          Team Name
                                        </Label>
                                        <p className="text-sm">
                                          {selectedTeam.name}
                                        </p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">
                                          Club
                                        </Label>
                                        <p className="text-sm">
                                          {selectedTeam.club ||
                                            selectedTeam.clubRef?.name ||
                                            'N/A'}
                                        </p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">
                                          City
                                        </Label>
                                        <p className="text-sm">
                                          {selectedTeam.city || 'N/A'}
                                        </p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">
                                          Country
                                        </Label>
                                        <p className="text-sm">
                                          {selectedTeam.country?.name || 'N/A'}
                                        </p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">
                                          Division
                                        </Label>
                                        <p className="text-sm">
                                          {selectedTeam.division?.name || 'N/A'}
                                        </p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">
                                          Level
                                        </Label>
                                        <p className="text-sm">
                                          {selectedTeam.level || 'N/A'}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Contact Information */}
                                    <div>
                                      <h4 className="mb-2 font-medium">
                                        Contact Information
                                      </h4>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label className="text-sm font-medium">
                                            Contact Person
                                          </Label>
                                          <p className="text-sm">
                                            {selectedTeam.contactFirstName}{' '}
                                            {selectedTeam.contactLastName}
                                          </p>
                                        </div>
                                        <div>
                                          <Label className="text-sm font-medium">
                                            Email
                                          </Label>
                                          <p className="text-sm">
                                            {selectedTeam.contactEmail}
                                          </p>
                                        </div>
                                        <div>
                                          <Label className="text-sm font-medium">
                                            Phone
                                          </Label>
                                          <p className="text-sm">
                                            {selectedTeam.contactPhone || 'N/A'}
                                          </p>
                                        </div>
                                        <div>
                                          <Label className="text-sm font-medium">
                                            Address
                                          </Label>
                                          <p className="text-sm">
                                            {selectedTeam.contactAddress ||
                                              'N/A'}
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Status Management */}
                                    <div>
                                      <h4 className="mb-2 font-medium">
                                        Status Management
                                      </h4>
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          onClick={() =>
                                            updateTeamStatus(
                                              selectedTeam.id,
                                              'APPROVED'
                                            )
                                          }
                                          disabled={
                                            isUpdating ||
                                            selectedTeam.status === 'APPROVED'
                                          }
                                        >
                                          Approve
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          onClick={() =>
                                            updateTeamStatus(
                                              selectedTeam.id,
                                              'REJECTED'
                                            )
                                          }
                                          disabled={
                                            isUpdating ||
                                            selectedTeam.status === 'REJECTED'
                                          }
                                        >
                                          Reject
                                        </Button>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(team)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredTeams.length === 0 && (
            <div className="py-8 text-center text-gray-500">
              No teams found matching the current filter.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
