'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Mail, Settings, Target, UserCheck, Copy, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface TournamentAssignment {
  id: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
  canConfigure: boolean;
  canManageScores: boolean;
  isReferee: boolean;
  isActive: boolean;
  assignedAt: string;
}

interface UserInvitation {
  id: string;
  email: string;
  canConfigure: boolean;
  canManageScores: boolean;
  isReferee: boolean;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  createdAt: string;
  expires: string;
  invitationUrl?: string;
}

interface UserInvitationsProps {
  tournamentId: string;
}

export function UserInvitations({ tournamentId }: UserInvitationsProps) {
  const t = useTranslations();
  const [assignments, setAssignments] = useState<TournamentAssignment[]>([]);
  const [invitations, setInvitations] = useState<UserInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [canConfigure, setCanConfigure] = useState(false);
  const [canManageScores, setCanManageScores] = useState(false);
  const [isReferee, setIsReferee] = useState(false);

  // Fetch assignments and invitations
  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch assignments
      const assignmentsResponse = await fetch(
        `/api/v1/tournaments/${tournamentId}/assignments`,
        {
          credentials: 'include',
        }
      );

      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json();
        setAssignments(assignmentsData);
      }

      // Fetch invitations
      const invitationsResponse = await fetch(
        `/api/v1/tournaments/${tournamentId}/invitations`,
        {
          credentials: 'include',
        }
      );

      if (invitationsResponse.ok) {
        const invitationsData = await invitationsResponse.json();
        setInvitations(invitationsData);
      }
    } catch (error) {
      console.error('Error fetching invitations data:', error);
      toast.error('Failed to load user assignments and invitations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tournamentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Email is required');
      return;
    }

    if (!canConfigure && !canManageScores && !isReferee) {
      toast.error('At least one permission must be selected');
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(
        `/api/v1/tournaments/${tournamentId}/invitations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            email,
            canConfigure,
            canManageScores,
            isReferee,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const invitation = data.invitation;

        if (invitation.emailSent) {
          toast.success('Invitation sent successfully via email');
        } else {
          // Email not sent - show invitation URL
          const invitationUrl = invitation.invitationUrl;
          toast.warning(
            `Invitation created but email not sent. Share this link: ${invitationUrl}`,
            { duration: 10000 }
          );
          // Also copy to clipboard
          if (navigator.clipboard) {
            navigator.clipboard.writeText(invitationUrl);
          }
        }

        setIsDialogOpen(false);
        setEmail('');
        setCanConfigure(false);
        setCanManageScores(false);
        setIsReferee(false);
        fetchData();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error('Failed to send invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline">Pending</Badge>;
      case 'ACCEPTED':
        return <Badge variant="default">Accepted</Badge>;
      case 'REJECTED':
        return <Badge variant="secondary">Rejected</Badge>;
      case 'EXPIRED':
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(
        `/api/v1/tournaments/${tournamentId}/invitations/${invitationId}/resend`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

      if (response.ok) {
        const data = await response.json();
        const invitation = data.invitation;

        if (invitation.emailSent) {
          toast.success('Invitation resent successfully via email');
        } else {
          // Email not sent - show invitation URL
          const invitationUrl = invitation.invitationUrl;
          toast.warning(
            `Invitation updated but email not sent. Share this link: ${invitationUrl}`,
            { duration: 10000 }
          );
          // Also copy to clipboard
          if (navigator.clipboard) {
            navigator.clipboard.writeText(invitationUrl);
          }
        }
        fetchData(); // Refresh the list
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to resend invitation');
      }
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast.error('Failed to resend invitation');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">User Access</h3>
          <p className="text-sm text-muted-foreground">
            Manage user permissions and invitations for this tournament
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite User to Tournament</DialogTitle>
              <DialogDescription>
                Send an invitation to a user to grant them access to this
                tournament with specific permissions.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label>Permissions</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="canConfigure"
                        checked={canConfigure}
                        onCheckedChange={(checked) =>
                          setCanConfigure(checked === true)
                        }
                      />
                      <Label
                        htmlFor="canConfigure"
                        className="flex items-center space-x-2 font-normal cursor-pointer"
                      >
                        <Settings className="h-4 w-4" />
                        <span>Configure Tournament</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="canManageScores"
                        checked={canManageScores}
                        onCheckedChange={(checked) =>
                          setCanManageScores(checked === true)
                        }
                      />
                      <Label
                        htmlFor="canManageScores"
                        className="flex items-center space-x-2 font-normal cursor-pointer"
                      >
                        <Target className="h-4 w-4" />
                        <span>Manage Scores</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isReferee"
                        checked={isReferee}
                        onCheckedChange={(checked) =>
                          setIsReferee(checked === true)
                        }
                      />
                      <Label
                        htmlFor="isReferee"
                        className="flex items-center space-x-2 font-normal cursor-pointer"
                      >
                        <UserCheck className="h-4 w-4" />
                        <span>Referee</span>
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending...' : 'Send Invitation'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>Active Users</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading...
            </div>
          ) : assignments.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No users have been assigned to this tournament yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {assignment.user.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {assignment.user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {assignment.canConfigure && (
                          <Badge variant="outline" className="text-xs">
                            <Settings className="mr-1 h-3 w-3" />
                            Configure
                          </Badge>
                        )}
                        {assignment.canManageScores && (
                          <Badge variant="outline" className="text-xs">
                            <Target className="mr-1 h-3 w-3" />
                            Scores
                          </Badge>
                        )}
                        {assignment.isReferee && (
                          <Badge variant="outline" className="text-xs">
                            <UserCheck className="mr-1 h-3 w-3" />
                            Referee
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(assignment.assignedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {assignment.isActive ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading...
            </div>
          ) : invitations.filter((i) => i.status === 'PENDING').length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No pending invitations.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations
                  .filter((i) => i.status === 'PENDING')
                  .map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{invitation.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {invitation.canConfigure && (
                            <Badge variant="outline" className="text-xs">
                              <Settings className="mr-1 h-3 w-3" />
                              Configure
                            </Badge>
                          )}
                          {invitation.canManageScores && (
                            <Badge variant="outline" className="text-xs">
                              <Target className="mr-1 h-3 w-3" />
                              Scores
                            </Badge>
                          )}
                          {invitation.isReferee && (
                            <Badge variant="outline" className="text-xs">
                              <UserCheck className="mr-1 h-3 w-3" />
                              Referee
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(invitation.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(invitation.expires).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(invitation.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {invitation.invitationUrl && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResendInvitation(invitation.id)}
                                title="Resend invitation"
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Resend
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  navigator.clipboard.writeText(invitation.invitationUrl!);
                                  toast.success('Invitation link copied to clipboard');
                                }}
                                title="Copy invitation link"
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy Link
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

