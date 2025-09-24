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
// import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Users, MapPin, Trophy } from 'lucide-react';
import { toast } from 'sonner';

interface Team {
  id: string;
  name: string;
  shortName?: string;
  club?: string;
  city?: string;
  level?: string;
  country: {
    id: string;
    name: string;
    code: string;
  };
  manager?: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    players: number;
    homeMatches: number;
    awayMatches: number;
  };
}

interface Country {
  id: string;
  name: string;
  code: string;
}

interface TeamsManagementProps {
  tournamentId: string;
  onTeamsChange?: (teams: Team[]) => void;
}

export function TeamsManagement({
  tournamentId,
  onTeamsChange,
}: TeamsManagementProps) {
  // const t = useTranslations();
  const [teams, setTeams] = useState<Team[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    club: '',
    city: '',
    countryId: '',
    level: '',
  });

  // Fetch teams and countries
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch teams
        const teamsResponse = await fetch(
          `/api/v1/tournaments/${tournamentId}/teams`,
          {
            credentials: 'include',
          }
        );

        if (teamsResponse.ok) {
          const teamsData = await teamsResponse.json();
          setTeams(teamsData);
          onTeamsChange?.(teamsData);
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
  }, [tournamentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.countryId) {
      toast.error('Name and country are required');
      return;
    }

    try {
      setIsSubmitting(true);

      const url = editingTeam
        ? `/api/v1/teams/${editingTeam.id}`
        : `/api/v1/tournaments/${tournamentId}/teams`;

      const method = editingTeam ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newTeam = await response.json();

        if (editingTeam) {
          const updatedTeams = teams.map((team) =>
            team.id === editingTeam.id ? newTeam : team
          );
          setTeams(updatedTeams);
          onTeamsChange?.(updatedTeams);
          toast.success('Team updated successfully');
        } else {
          const updatedTeams = [...teams, newTeam];
          setTeams(updatedTeams);
          onTeamsChange?.(updatedTeams);
          toast.success('Team added successfully');
        }

        resetForm();
        setIsDialogOpen(false);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save team');
      }
    } catch (error) {
      console.error('Error saving team:', error);
      toast.error('Failed to save team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      shortName: team.shortName || '',
      club: team.club || '',
      city: team.city || '',
      countryId: team.country.id,
      level: team.level || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team?')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/teams/${teamId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        const updatedTeams = teams.filter((team) => team.id !== teamId);
        setTeams(updatedTeams);
        onTeamsChange?.(updatedTeams);
        toast.success('Team deleted successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete team');
      }
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error('Failed to delete team');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      shortName: '',
      club: '',
      city: '',
      countryId: '',
      level: '',
    });
    setEditingTeam(null);
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
          <p className="text-muted-foreground">Loading teams...</p>
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
            <span>Teams ({teams.length})</span>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Add Team
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingTeam ? 'Edit Team' : 'Add New Team'}
                </DialogTitle>
                <DialogDescription>
                  {editingTeam
                    ? 'Update the team information below.'
                    : 'Add a new team to this tournament.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Team Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter team name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shortName">Short Name</Label>
                  <Input
                    id="shortName"
                    value={formData.shortName}
                    onChange={(e) =>
                      setFormData({ ...formData, shortName: e.target.value })
                    }
                    placeholder="e.g., FCB, RMA"
                    maxLength={10}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="club">Club</Label>
                  <Input
                    id="club"
                    value={formData.club}
                    onChange={(e) =>
                      setFormData({ ...formData, club: e.target.value })
                    }
                    placeholder="Enter club name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    placeholder="Enter city"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="countryId">Country *</Label>
                  <Select
                    value={formData.countryId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, countryId: value })
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

                <div className="space-y-2">
                  <Label htmlFor="level">Level</Label>
                  <Select
                    value={formData.level}
                    onValueChange={(value) =>
                      setFormData({ ...formData, level: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="elite">Elite</SelectItem>
                      <SelectItem value="competitive">Competitive</SelectItem>
                      <SelectItem value="challenge">Challenge</SelectItem>
                      <SelectItem value="recreational">Recreational</SelectItem>
                    </SelectContent>
                  </Select>
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
                      : editingTeam
                        ? 'Update Team'
                        : 'Add Team'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
        <CardDescription>
          Manage teams participating in this tournament
        </CardDescription>
      </CardHeader>
      <CardContent>
        {teams.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No teams yet</h3>
            <p className="mb-4 text-muted-foreground">
              Get started by adding the first team to this tournament.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Team
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead>Club</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Players</TableHead>
                  <TableHead>Matches</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{team.name}</div>
                        {team.shortName && (
                          <div className="text-sm text-muted-foreground">
                            {team.shortName}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{team.club || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {[team.city, team.country.name]
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {team.level ? (
                        <Badge variant="outline">{team.level}</Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span>{team._count.players}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Trophy className="h-3 w-3 text-muted-foreground" />
                        <span>
                          {team._count.homeMatches + team._count.awayMatches}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(team)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(team.id)}
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
