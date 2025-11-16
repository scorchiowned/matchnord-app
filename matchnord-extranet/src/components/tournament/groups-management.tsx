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
import { DivisionFilter } from './division-filter';
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
  Users,
  Trophy,
  Shuffle,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  assignTeamsToGroups,
  generateGroupNames,
  type Team,
} from '@/lib/tournament/group-assignment';
import { StandingsTable } from './standings-table';

interface TeamWithDivision {
  id: string;
  name: string;
  shortName?: string;
  divisionId?: string;
  club?: string | { name: string };
  clubRef?: {
    id: string;
    name: string;
    logo?: string;
  };
  city?: string;
  level?: string;
  seed?: number;
}

interface GroupWithDetails {
  id: string;
  name: string;
  divisionId: string;
  division: {
    id: string;
    name: string;
    level?: string;
  };
  teams: TeamWithDivision[];
  _count: {
    teams: number;
    matches: number;
  };
}

interface DivisionWithTeams {
  id: string;
  name: string;
  level?: string;
  maxTeams: number;
  minTeams: number;
  teams: TeamWithDivision[];
  groups: GroupWithDetails[];
}

interface GroupsManagementProps {
  tournamentId: string;
  onGroupsChange?: (groups: { id: string }[]) => void;
  onMatchesChange?: (matches: unknown[]) => void;
}

export function GroupsManagement({
  tournamentId,
  onGroupsChange,
  onMatchesChange,
}: GroupsManagementProps) {
  const [divisions, setDivisions] = useState<DivisionWithTeams[]>([]);
  const [allTournamentTeams, setAllTournamentTeams] = useState<
    TeamWithDivision[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupWithDetails | null>(
    null
  );

  // Helper function to update divisions and call callback
  const updateDivisions = (
    updater: (prev: DivisionWithTeams[]) => DivisionWithTeams[]
  ) => {
    setDivisions((prev) => {
      const updated = updater(prev);
      // Calculate total groups count and call callback
      const totalGroups = updated.reduce(
        (sum, division) => sum + division.groups.length,
        0
      );
      onGroupsChange?.(
        Array.from({ length: totalGroups }, (_, i) => ({ id: `group-${i}` }))
      );
      return updated;
    });
  };
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [assigningTeams, setAssigningTeams] = useState<string | null>(null);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    divisionId: '',
  });

  // Fetch divisions with teams and groups
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch divisions
        const divisionsResponse = await fetch(
          `/api/v1/tournaments/${tournamentId}/divisions`,
          {
            credentials: 'include',
          }
        );

        if (divisionsResponse.ok) {
          const divisionsData = await divisionsResponse.json();

          // Fetch all teams for the tournament
          const teamsResponse = await fetch(
            `/api/v1/tournaments/${tournamentId}/teams`,
            {
              credentials: 'include',
            }
          );

          const allTeams = teamsResponse.ok ? await teamsResponse.json() : [];
          setAllTournamentTeams(allTeams);

          // Assign teams to their respective divisions
          const divisionsWithTeams = divisionsData.map(
            (division: DivisionWithTeams) => {
              // Filter teams that are actually assigned to this division
              const teamsForDivision = allTeams.filter(
                (team: TeamWithDivision) => team.divisionId === division.id
              );

              return {
                ...division,
                teams: teamsForDivision,
                groups: [],
              };
            }
          );

          updateDivisions(() => divisionsWithTeams);

          // Set the first division as selected by default
          if (divisionsWithTeams.length > 0 && !selectedDivision) {
            setSelectedDivision(divisionsWithTeams[0].id);
          }
        }

        // Fetch groups
        const groupsResponse = await fetch(
          `/api/v1/tournaments/${tournamentId}/groups`,
          {
            credentials: 'include',
          }
        );

        if (groupsResponse.ok) {
          const groupsData = await groupsResponse.json();

          // Group groups by division
          const groupsByDivision = groupsData.reduce(
            (
              acc: Record<string, GroupWithDetails[]>,
              group: GroupWithDetails
            ) => {
              const divisionId = group.division.id;
              if (!acc[divisionId]) {
                acc[divisionId] = [];
              }
              acc[divisionId].push(group);
              return acc;
            },
            {}
          );

          // Update divisions with their groups
          updateDivisions((prev) =>
            prev.map((division) => ({
              ...division,
              groups: groupsByDivision[division.id] || [],
            }))
          );

          // Calculate unassigned teams
          const assignedTeamIds = new Set();
          groupsData.forEach((group: GroupWithDetails) => {
            group.teams.forEach((team: TeamWithDivision) => {
              assignedTeamIds.add(team.id);
            });
          });

          // Unassigned teams are now calculated on the fly when needed
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.divisionId) {
      toast.error('Name and division are required');
      return;
    }

    try {
      setIsSubmitting(true);

      // Verify division exists
      const division = divisions.find((d) => d.id === formData.divisionId);
      if (!division) {
        throw new Error('Division not found');
      }

      // Check if adding a new group (not editing) and if there are existing matches
      if (!editingGroup) {
        const existingMatches = division.groups.reduce(
          (total, group) => total + (group._count.matches || 0),
          0
        );

        if (existingMatches > 0) {
          const confirmed = confirm(
            `⚠️ Warning: Adding a new group will clear all existing matches (${existingMatches} matches will be deleted).\n\n` +
              'You will need to regenerate matches after adding the group.\n\n' +
              'Do you want to continue?'
          );

          if (!confirmed) {
            setIsSubmitting(false);
            return;
          }
        }
      }

      const url = editingGroup
        ? `/api/v1/groups/${editingGroup.id}`
        : `/api/v1/tournaments/${tournamentId}/groups`;

      const method = editingGroup ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          divisionId: formData.divisionId,
        }),
      });

      if (response.ok) {
        const newGroup = await response.json();

        if (editingGroup) {
          // Update existing group
          updateDivisions((prev) =>
            prev.map((division) => ({
              ...division,
              groups: division.groups.map((group) =>
                group.id === editingGroup.id ? newGroup : group
              ),
            }))
          );
          toast.success('Group updated successfully');
        } else {
          // Add new group
          updateDivisions((prev) =>
            prev.map((division) => {
              if (division.id === formData.divisionId) {
                return {
                  ...division,
                  groups: [...division.groups, newGroup],
                };
              }
              return division;
            })
          );

          // Clear existing matches for this division when adding a new group
          try {
            const clearMatchesResponse = await fetch(
              `/api/v1/tournaments/${tournamentId}/matches/bulk`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                  action: 'clear_all',
                  divisionId: formData.divisionId,
                }),
              }
            );

            if (clearMatchesResponse.ok) {
              // Notify parent that matches have been cleared
              onMatchesChange?.([]);
              toast.success(
                'Group added successfully. Existing matches have been cleared.'
              );
            } else {
              toast.success(
                'Group added successfully, but failed to clear existing matches.'
              );
            }
          } catch (error) {
            console.error('Error clearing matches:', error);
            toast.success(
              'Group added successfully, but failed to clear existing matches.'
            );
          }
        }

        resetForm();
        setIsDialogOpen(false);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save group');
      }
    } catch (error) {
      console.error('Error saving group:', error);
      toast.error('Failed to save group');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (group: GroupWithDetails) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      divisionId: group.division.id,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group?')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/groups/${groupId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        updateDivisions((prev) =>
          prev.map((division) => ({
            ...division,
            groups: division.groups.filter((group) => group.id !== groupId),
          }))
        );
        toast.success('Group deleted successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete group');
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Failed to delete group');
    }
  };

  const handleAutoAssignTeams = async (division: DivisionWithTeams) => {
    if (division.teams.length === 0) {
      toast.error('No teams available for assignment');
      return;
    }

    try {
      // Create groups if none exist
      if (division.groups.length === 0) {
        const groupNames = generateGroupNames(
          Math.ceil(division.teams.length / 4)
        );

        for (const groupName of groupNames) {
          const response = await fetch(
            `/api/v1/tournaments/${tournamentId}/groups`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                name: groupName,
                divisionId: division.id,
              }),
            }
          );

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create groups');
          }
        }

        // Refresh groups
        const groupsResponse = await fetch(
          `/api/v1/tournaments/${tournamentId}/groups`,
          { credentials: 'include' }
        );
        if (groupsResponse.ok) {
          const groupsData = await groupsResponse.json();
          const divisionGroups = groupsData.filter(
            (g: GroupWithDetails) => g.division.id === division.id
          );

          updateDivisions((prev) =>
            prev.map((d) =>
              d.id === division.id ? { ...d, groups: divisionGroups } : d
            )
          );
        }
      }

      // Get updated groups for this division
      const currentDivision = divisions.find((d) => d.id === division.id);
      if (!currentDivision) {
        throw new Error('Division not found');
      }

      // All teams can be assigned to any division - the division level is already determined
      const eligibleTeams = allTournamentTeams.filter(
        (team) => team.divisionId === division.id
      );

      // Convert groups to the format expected by assignTeamsToGroups
      const groupsForAssignment = currentDivision.groups.map((g) => ({
        id: g.id,
        name: g.name,
        maxTeams: 8, // Default max teams per group
        teams: [],
        divisionId: g.divisionId,
      }));

      // Assign teams to groups
      const updatedGroups = assignTeamsToGroups(
        eligibleTeams as Team[],
        groupsForAssignment,
        { strategy: 'balanced' }
      );

      // Update each group with assigned teams
      for (const group of updatedGroups) {
        const matchingGroup = currentDivision.groups.find(
          (g) => g.id === group.id
        );
        if (matchingGroup && group.teams.length > 0) {
          await fetch(`/api/v1/groups/${group.id}/teams`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              teamIds: group.teams.map((team) => team.id),
            }),
          });
        }
      }

      // Get updated groups for this division after assignment
      const groupsResponse = await fetch(
        `/api/v1/tournaments/${tournamentId}/groups`,
        { credentials: 'include' }
      );

      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json();
        const divisionGroups = groupsData.filter(
          (g: GroupWithDetails) => g.division.id === division.id
        );

        // Update the state with the new groups
        updateDivisions((prev) =>
          prev.map((d) =>
            d.id === division.id ? { ...d, groups: divisionGroups } : d
          )
        );

        // Unassigned teams are now calculated on the fly when needed
      }

      toast.success('Teams assigned to groups successfully');
    } catch (error) {
      console.error('Error auto-assigning teams:', error);
      toast.error('Failed to assign teams to groups');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      divisionId: selectedDivision || '',
    });
    setEditingGroup(null);
  };

  const handleAssignTeams = async (groupId: string) => {
    if (selectedTeams.length === 0) {
      toast.error('Please select teams to assign');
      return;
    }

    try {
      const response = await fetch(`/api/v1/groups/${groupId}/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          teamIds: selectedTeams,
        }),
      });

      if (response.ok) {
        const updatedGroup = await response.json();

        // Update the state locally instead of refreshing
        updateDivisions((prev) =>
          prev.map((division) => ({
            ...division,
            groups: division.groups.map((group) =>
              group.id === groupId ? updatedGroup : group
            ),
          }))
        );

        // Unassigned teams are now calculated on the fly when needed

        toast.success('Teams assigned successfully');
        setAssigningTeams(null);
        setSelectedTeams([]);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to assign teams');
      }
    } catch (error) {
      console.error('Error assigning teams:', error);
      toast.error('Failed to assign teams');
    }
  };

  const handleRemoveTeam = async (groupId: string, teamId: string) => {
    try {
      const response = await fetch(`/api/v1/groups/${groupId}/teams`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          teamIds: [teamId],
        }),
      });

      if (response.ok) {
        const updatedGroup = await response.json();

        // Update the state locally instead of refreshing
        updateDivisions((prev) =>
          prev.map((division) => ({
            ...division,
            groups: division.groups.map((group) =>
              group.id === groupId ? updatedGroup : group
            ),
          }))
        );

        // Unassigned teams are now calculated on the fly when needed

        toast.success('Team removed successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to remove team');
      }
    } catch (error) {
      console.error('Error removing team:', error);
      toast.error('Failed to remove team');
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading groups...</span>
      </div>
    );
  }

  // Get the selected division
  const currentDivision = divisions.find((d) => d.id === selectedDivision);

  return (
    <div className="space-y-6">
      {/* Groups Management */}
      <Card className="border-0 shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* <Trophy className="h-5 w-5" /> */}
              <span>Groups</span>
              {/* {currentDivision && (
                <>
                  <Badge
                    variant="default"
                    className="bg-blue-100 text-blue-800"
                  >
                    {currentDivision.level || 'No Level'}
                  </Badge>
                  <Badge variant="outline">
                    {currentDivision.teams.length} teams
                  </Badge>
                  {(() => {
                    const assignedTeams = currentDivision.groups.reduce(
                      (total, group) => total + group.teams.length,
                      0
                    );
                    const unassignedCount =
                      currentDivision.teams.length - assignedTeams;
                    return unassignedCount > 0 ? (
                      <Badge
                        variant="destructive"
                        className="bg-red-100 text-red-800"
                      >
                        ⚠️ {unassignedCount} unassigned
                      </Badge>
                    ) : null;
                  })()}
                </>
              )} */}
            </div>
            {currentDivision && (
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => handleAutoAssignTeams(currentDivision)}
                  disabled={currentDivision.teams.length === 0}
                  variant="outline"
                  size="sm"
                >
                  <Shuffle className="mr-2 h-4 w-4" />
                  Auto Assign Teams
                </Button>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetForm} size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Group
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>
                        {editingGroup ? 'Edit Group' : 'Add New Group'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingGroup
                          ? 'Update the group information below.'
                          : 'Select a division and create a new group within it.'}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Group Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          placeholder="e.g., Group A, Group B"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="divisionId">Division</Label>
                        <div className="flex items-center space-x-2 rounded-md border border-input bg-muted px-3 py-2 text-sm">
                          <Trophy className="h-4 w-4" />
                          <span className="font-medium">
                            {currentDivision?.name}
                          </span>
                          <Badge variant="outline" className="ml-auto">
                            {currentDivision?.teams.length} teams
                          </Badge>
                        </div>
                        <input
                          type="hidden"
                          value={formData.divisionId}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              divisionId: e.target.value,
                            })
                          }
                        />
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
                            : editingGroup
                              ? 'Update Group'
                              : 'Add Group'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </CardTitle>
          {/* Division Tabs */}
          {divisions.length > 1 && (
            <div className="mt-4">
              <DivisionFilter
                divisions={divisions}
                selectedDivision={selectedDivision}
                onDivisionChange={setSelectedDivision}
                showAllOption={false}
              />
            </div>
          )}
          {/* {currentDivision && (
            <CardDescription>
              {(() => {
                const assignedTeams = currentDivision.groups.reduce(
                  (total, group) => total + group.teams.length,
                  0
                );
                const unassignedCount =
                  currentDivision.teams.length - assignedTeams;
                return unassignedCount > 0
                  ? `Manage groups and team assignments for ${currentDivision.name}. ${unassignedCount} team${unassignedCount !== 1 ? 's' : ''} still need${unassignedCount === 1 ? 's' : ''} to be assigned to groups.`
                  : `Manage groups and team assignments for ${currentDivision.name}. All teams are assigned to groups.`;
              })()}
            </CardDescription>
          )} */}
        </CardHeader>
        <CardContent>
          {/* Unassigned Teams Section */}
          {currentDivision &&
            currentDivision.teams.filter(
              (team) =>
                // Show unassigned teams for the current division
                !currentDivision.groups.some((group) =>
                  group.teams.some((groupTeam) => groupTeam.id === team.id)
                )
            ).length > 0 && (
              <div className="mb-6">
                <Card className="border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-red-800">
                      <Users className="h-5 w-5" />
                      <span>⚠️ Unassigned Teams</span>
                      <Badge
                        variant="outline"
                        className="bg-red-100 text-red-800"
                      >
                        {
                          currentDivision.teams.filter(
                            (team) =>
                              !currentDivision.groups.some((group) =>
                                group.teams.some(
                                  (groupTeam) => groupTeam.id === team.id
                                )
                              )
                          ).length
                        }{' '}
                        team
                        {currentDivision.teams.filter(
                          (team) =>
                            !currentDivision.groups.some((group) =>
                              group.teams.some(
                                (groupTeam) => groupTeam.id === team.id
                              )
                            )
                        ).length !== 1
                          ? 's'
                          : ''}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-red-700">
                      <strong>Action Required:</strong> These teams haven&apos;t
                      been assigned to any group yet. You need to assign them to
                      groups to complete the tournament organization.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {currentDivision.teams
                        .filter(
                          (team) =>
                            !currentDivision.groups.some((group) =>
                              group.teams.some(
                                (groupTeam) => groupTeam.id === team.id
                              )
                            )
                        )
                        .map((team) => (
                          <div
                            key={team.id}
                            className="flex items-center space-x-3 rounded-lg border border-red-200 bg-white p-4 shadow-sm"
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 text-sm font-bold text-white">
                              {team.shortName?.charAt(0) || team.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900">
                                {team.name}
                              </p>
                              {team.club && (
                                <p className="text-xs text-gray-600">
                                  {typeof team.club === 'string'
                                    ? team.club
                                    : (team.club as { name: string }).name}
                                </p>
                              )}
                              {team.level && (
                                <Badge
                                  variant="outline"
                                  className="mt-1 border-red-300 text-xs text-red-700"
                                >
                                  {team.level}
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs font-medium text-red-600">
                              Not assigned
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          {/* Groups Content */}
          {currentDivision ? (
            currentDivision.groups.length === 0 ? (
              <div className="py-12 text-center">
                <Trophy className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">No groups yet</h3>
                <p className="mb-4 text-muted-foreground">
                  Create groups to organize teams in this division.
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Group
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {currentDivision.groups.map((group) => (
                  <div key={group.id} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold">{group.name}</h3>
                        <Badge variant="secondary">
                          {group._count.teams} teams
                        </Badge>
                        <Badge
                          variant="default"
                          className="bg-blue-100 text-blue-800"
                        >
                          {group.division.level}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAssigningTeams(group.id);
                            setSelectedTeams([]);
                          }}
                        >
                          <Users className="mr-1 h-4 w-4" />
                          Assign Teams
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(group)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(group.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <StandingsTable
                      group={{
                        id: group.id,
                        name: group.name,
                        stage: {
                          id: group.id,
                          name: group.name,
                          type: 'GROUP',
                          division: {
                            id: group.division.id,
                            name: group.division.name,
                            level: group.division.level || '',
                          },
                        },
                        teams: group.teams.map((team) => ({
                          id: team.id,
                          name: team.name,
                          shortName: team.shortName,
                          logo: undefined,
                          club:
                            typeof team.club === 'string'
                              ? team.club
                              : undefined,
                          clubRef: team.clubRef,
                          city: team.city,
                          level: team.level,
                        })),
                        _count: group._count,
                      }}
                      showDivisionInfo={false}
                      onRemoveTeam={handleRemoveTeam}
                    />
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="py-12 text-center">
              <Trophy className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">Select a division</h3>
              <p className="mb-4 text-muted-foreground">
                {divisions.length === 0
                  ? 'No divisions available. Create divisions first.'
                  : 'Please select a division to manage groups.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Assignment Dialog */}
      <Dialog
        open={!!assigningTeams}
        onOpenChange={() => setAssigningTeams(null)}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Assign Teams to Group</DialogTitle>
            <DialogDescription>
              Select unassigned teams from this division to assign to this
              group.
            </DialogDescription>
          </DialogHeader>

          {assigningTeams && (
            <div className="space-y-4">
              <div className="max-h-60 space-y-2 overflow-y-auto">
                {(() => {
                  const division = divisions.find((d) =>
                    d.groups.some((g) => g.id === assigningTeams)
                  );

                  if (!division) return null;

                  // Get all teams assigned to this division's groups
                  const assignedTeamIds = new Set();
                  division.groups.forEach((group) => {
                    group.teams.forEach((team) => {
                      assignedTeamIds.add(team.id);
                    });
                  });

                  // Filter to show unassigned teams for this specific division
                  const availableTeams = division.teams.filter((team) => {
                    // Only show teams that are not assigned to any group in this division
                    if (assignedTeamIds.has(team.id)) return false;

                    // Additional level validation (teams should already be filtered by level when assigned to division)
                    return true;
                  });

                  if (availableTeams.length === 0) {
                    return (
                      <div className="py-8 text-center">
                        <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                        <h3 className="mb-2 text-lg font-semibold">
                          No unassigned teams available
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          All teams in this division are already assigned to
                          groups.
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Check the unassigned teams section above for teams
                          from other divisions that need assignment.
                        </p>
                      </div>
                    );
                  }

                  return availableTeams.map((team) => (
                    <div
                      key={team.id}
                      className="flex items-center space-x-2 rounded-lg border p-3"
                    >
                      <input
                        type="checkbox"
                        id={`team-${team.id}`}
                        checked={selectedTeams.includes(team.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTeams([...selectedTeams, team.id]);
                          } else {
                            setSelectedTeams(
                              selectedTeams.filter((id) => id !== team.id)
                            );
                          }
                        }}
                        className="h-4 w-4"
                      />
                      <label
                        htmlFor={`team-${team.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div>
                          <p className="text-sm font-medium">{team.name}</p>
                          {team.club && (
                            <p className="text-xs text-muted-foreground">
                              {typeof team.club === 'string'
                                ? team.club
                                : (team.club as { name: string }).name}
                            </p>
                          )}
                          {team.level && (
                            <p className="text-xs font-medium text-blue-600">
                              Level: {team.level}
                            </p>
                          )}
                        </div>
                      </label>
                    </div>
                  ));
                })()}
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAssigningTeams(null);
                    setSelectedTeams([]);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() =>
                    assigningTeams && handleAssignTeams(assigningTeams)
                  }
                  disabled={selectedTeams.length === 0}
                >
                  Assign {selectedTeams.length} Team
                  {selectedTeams.length !== 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
