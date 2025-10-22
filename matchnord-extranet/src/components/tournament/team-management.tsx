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
} from 'lucide-react';
import { toast } from 'sonner';

interface Team {
  id: string;
  name: string;
  club?: string;
  city?: string;
  country?: {
    name: string;
    code: string;
  };
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

interface TeamManagementProps {
  tournamentId: string;
  onTeamsChange?: (teams: Team[]) => void;
}

export function TeamManagement({
  tournamentId,
  onTeamsChange,
}: TeamManagementProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch teams
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/v1/tournaments/${tournamentId}/registrations`,
          {
            credentials: 'include',
          }
        );

        if (response.ok) {
          const data = await response.json();
          setTeams(data);
          onTeamsChange?.(data);
        } else {
          toast.error('Failed to load teams');
        }
      } catch (error) {
        console.error('Error fetching teams:', error);
        toast.error('Failed to load teams');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeams();
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
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total</p>
                <p className="text-2xl font-bold">{statusCounts.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
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
        <Card>
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
        <Card>
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
        <Card>
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
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Teams & Registrations</CardTitle>
              <CardDescription>
                Manage team registrations and approvals. Use filters to view
                different team statuses.
              </CardDescription>
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
                  <TableHead className="w-12">
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
                  <TableHead>Team</TableHead>
                  <TableHead>Division</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="w-12">Actions</TableHead>
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
                      <div>
                        <div className="font-medium">{team.name}</div>
                        <div className="text-sm text-gray-500">
                          {team.club?.name && `${team.club.name} • `}
                          {team.city && `${team.city}, `}
                          {team.country?.name}
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
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedTeam(team)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Team Details</DialogTitle>
                            <DialogDescription>
                              View and manage team registration details
                            </DialogDescription>
                          </DialogHeader>
                          {selectedTeam && (
                            <div className="space-y-6">
                              {/* Team Information */}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium">
                                    Team Name
                                  </Label>
                                  <p className="text-sm">{selectedTeam.name}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">
                                    Club
                                  </Label>
                                  <p className="text-sm">
                                    {selectedTeam.club?.name || 'N/A'}
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
                                      {selectedTeam.contactAddress || 'N/A'}
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
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
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
