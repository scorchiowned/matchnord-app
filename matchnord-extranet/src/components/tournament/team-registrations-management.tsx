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

interface TeamRegistrationsManagementProps {
  tournamentId: string;
  onRegistrationsChange?: (teams: Team[]) => void;
}

export function TeamRegistrationsManagement({
  tournamentId,
  onRegistrationsChange,
}: TeamRegistrationsManagementProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch teams (registrations)
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
          onRegistrationsChange?.(data);
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
  }, [tournamentId, onRegistrationsChange]);

  const getStatusBadge = (status: string, isWaitlisted: boolean) => {
    if (isWaitlisted) {
      return <Badge variant="secondary">Waitlisted</Badge>;
    }

    switch (status) {
      case 'PENDING':
        return (
          <Badge
            variant="outline"
            className="border-yellow-600 text-yellow-600"
          >
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      case 'APPROVED':
        return (
          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="mr-1 h-3 w-3" />
            Approved
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleStatusUpdate = async (
    registrationId: string,
    newStatus: 'APPROVED' | 'REJECTED',
    notes?: string
  ) => {
    try {
      setIsUpdating(true);
      const response = await fetch(
        `/api/v1/registrations/${registrationId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ status: newStatus, notes }),
        }
      );

      if (response.ok) {
        const updatedRegistration = await response.json();
        setRegistrations((prev) =>
          prev.map((reg) =>
            reg.id === registrationId ? updatedRegistration : reg
          )
        );
        toast.success(`Registration ${newStatus.toLowerCase()} successfully`);
        setIsDetailDialogOpen(false);
        setSelectedRegistration(null);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update registration');
      }
    } catch (error) {
      console.error('Error updating registration:', error);
      toast.error('Failed to update registration');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkStatusUpdate = async (newStatus: 'APPROVED' | 'REJECTED') => {
    if (selectedRegistrations.length === 0) {
      toast.error('Please select registrations to update');
      return;
    }

    try {
      setIsUpdating(true);
      const promises = selectedRegistrations.map((id) =>
        fetch(`/api/v1/registrations/${id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ status: newStatus }),
        })
      );

      const results = await Promise.all(promises);
      const failed = results.filter((r) => !r.ok).length;

      if (failed === 0) {
        toast.success(
          `All ${selectedRegistrations.length} registrations ${newStatus.toLowerCase()} successfully`
        );
        setSelectedRegistrations([]);
        // Refresh registrations
        window.location.reload();
      } else {
        toast.error(`${failed} registrations failed to update`);
      }
    } catch (error) {
      console.error('Error bulk updating registrations:', error);
      toast.error('Failed to update registrations');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    const filteredRegistrations = getFilteredRegistrations();
    if (checked) {
      setSelectedRegistrations(filteredRegistrations.map((r) => r.id));
    } else {
      setSelectedRegistrations([]);
    }
  };

  const handleSelectRegistration = (
    registrationId: string,
    checked: boolean
  ) => {
    if (checked) {
      setSelectedRegistrations((prev) => [...prev, registrationId]);
    } else {
      setSelectedRegistrations((prev) =>
        prev.filter((id) => id !== registrationId)
      );
    }
  };

  const getFilteredRegistrations = () => {
    if (statusFilter === 'ALL') {
      return registrations;
    }
    return registrations.filter((reg) => reg.status === statusFilter);
  };

  const filteredRegistrations = getFilteredRegistrations();

  const getStatusCounts = () => {
    const counts = {
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
      WAITLISTED: 0,
    };

    registrations.forEach((reg) => {
      if (reg.isWaitlisted) {
        counts.WAITLISTED++;
      } else {
        counts[reg.status as keyof typeof counts]++;
      }
    });

    return counts;
  };

  const statusCounts = getStatusCounts();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading registrations...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Team Registrations ({registrations.length})</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </CardTitle>
        <CardDescription>
          Manage team registrations and approval status
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Status Summary */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg border p-3">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">Pending</span>
            </div>
            <p className="text-2xl font-bold">{statusCounts.PENDING}</p>
          </div>
          <div className="rounded-lg border p-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Approved</span>
            </div>
            <p className="text-2xl font-bold">{statusCounts.APPROVED}</p>
          </div>
          <div className="rounded-lg border p-3">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium">Rejected</span>
            </div>
            <p className="text-2xl font-bold">{statusCounts.REJECTED}</p>
          </div>
          <div className="rounded-lg border p-3">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Waitlisted</span>
            </div>
            <p className="text-2xl font-bold">{statusCounts.WAITLISTED}</p>
          </div>
        </div>

        {/* Filters and Bulk Actions */}
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  All ({registrations.length})
                </SelectItem>
                <SelectItem value="PENDING">
                  Pending ({statusCounts.PENDING})
                </SelectItem>
                <SelectItem value="APPROVED">
                  Approved ({statusCounts.APPROVED})
                </SelectItem>
                <SelectItem value="REJECTED">
                  Rejected ({statusCounts.REJECTED})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedRegistrations.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {selectedRegistrations.length} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkStatusUpdate('APPROVED')}
                disabled={isUpdating}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkStatusUpdate('REJECTED')}
                disabled={isUpdating}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </div>
          )}
        </div>

        {filteredRegistrations.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">
              No registrations found
            </h3>
            <p className="text-muted-foreground">
              {statusFilter === 'ALL'
                ? 'No teams have registered for this tournament yet.'
                : `No ${statusFilter.toLowerCase()} registrations found.`}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        selectedRegistrations.length ===
                          filteredRegistrations.length &&
                        filteredRegistrations.length > 0
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Division</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations.map((registration) => (
                  <TableRow key={registration.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedRegistrations.includes(
                          registration.id
                        )}
                        onCheckedChange={(checked) =>
                          handleSelectRegistration(
                            registration.id,
                            checked as boolean
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {registration.teamName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {registration.club} • {registration.city},{' '}
                          {registration.country}
                        </div>
                        {registration.level && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {registration.level}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Trophy className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {registration.division.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm font-medium">
                          {registration.contactFirstName}{' '}
                          {registration.contactLastName}
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span>{registration.contactEmail}</span>
                        </div>
                        {registration.contactPhone && (
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{registration.contactPhone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(
                        registration.status,
                        registration.isWaitlisted
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(
                            registration.submittedAt
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedRegistration(registration);
                          setIsDetailDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Registration Details Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registration Details</DialogTitle>
              <DialogDescription>
                Review and manage this team registration
              </DialogDescription>
            </DialogHeader>

            {selectedRegistration && (
              <div className="space-y-6">
                {/* Team Information */}
                <div>
                  <h3 className="mb-3 text-lg font-semibold">
                    Team Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Team Name</Label>
                      <p className="text-sm">{selectedRegistration.teamName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Club</Label>
                      <p className="text-sm">{selectedRegistration.club}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">City</Label>
                      <p className="text-sm">{selectedRegistration.city}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Country</Label>
                      <p className="text-sm">{selectedRegistration.country}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Level</Label>
                      <p className="text-sm">
                        {selectedRegistration.level || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Division</Label>
                      <p className="text-sm">
                        {selectedRegistration.division.name}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="mb-3 text-lg font-semibold">
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Name</Label>
                      <p className="text-sm">
                        {selectedRegistration.contactFirstName}{' '}
                        {selectedRegistration.contactLastName}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-sm">
                        {selectedRegistration.contactEmail}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Phone</Label>
                      <p className="text-sm">
                        {selectedRegistration.contactPhone || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Address</Label>
                      <p className="text-sm">
                        {selectedRegistration.contactAddress || 'Not provided'}
                        {selectedRegistration.contactPostalCode &&
                          `, ${selectedRegistration.contactPostalCode}`}
                        {selectedRegistration.contactCity &&
                          `, ${selectedRegistration.contactCity}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Billing Information (if different) */}
                {(selectedRegistration.billingName ||
                  selectedRegistration.billingAddress) && (
                  <div>
                    <h3 className="mb-3 text-lg font-semibold">
                      Billing Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">
                          Billing Name
                        </Label>
                        <p className="text-sm">
                          {selectedRegistration.billingName || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Billing Email
                        </Label>
                        <p className="text-sm">
                          {selectedRegistration.billingEmail || 'Not provided'}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-sm font-medium">
                          Billing Address
                        </Label>
                        <p className="text-sm">
                          {selectedRegistration.billingAddress ||
                            'Not provided'}
                          {selectedRegistration.billingPostalCode &&
                            `, ${selectedRegistration.billingPostalCode}`}
                          {selectedRegistration.billingCity &&
                            `, ${selectedRegistration.billingCity}`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Status and Actions */}
                <div>
                  <h3 className="mb-3 text-lg font-semibold">
                    Status & Actions
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">
                        Current Status
                      </Label>
                      <div className="mt-1">
                        {getStatusBadge(
                          selectedRegistration.status,
                          selectedRegistration.isWaitlisted
                        )}
                      </div>
                    </div>

                    {selectedRegistration.status === 'PENDING' && (
                      <div className="flex space-x-2">
                        <Button
                          onClick={() =>
                            handleStatusUpdate(
                              selectedRegistration.id,
                              'APPROVED'
                            )
                          }
                          disabled={isUpdating}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() =>
                            handleStatusUpdate(
                              selectedRegistration.id,
                              'REJECTED'
                            )
                          }
                          disabled={isUpdating}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
