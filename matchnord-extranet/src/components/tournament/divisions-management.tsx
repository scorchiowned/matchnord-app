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
import {
  Plus,
  Edit,
  Trash2,
  Trophy,
  Users,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

interface Division {
  id: string;
  name: string;
  description?: string;
  birthYear?: number;
  format?: string;
  level: string;
  minTeams: number;
  maxTeams: number;
  currentTeams: number;
  _count: {
    registrations: number;
    stages: number;
  };
}

interface DivisionsManagementProps {
  tournamentId: string;
  onDivisionsChange?: (divisions: Division[]) => void;
}

export function DivisionsManagement({
  tournamentId,
  onDivisionsChange,
}: DivisionsManagementProps) {
  // const t = useTranslations();
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingDivision, setEditingDivision] = useState<Division | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    birthYear: '',
    format: '',
    level: 'COMPETITIVE',
    minTeams: '4',
    maxTeams: '16',
  });

  // Fetch divisions
  useEffect(() => {
    const fetchDivisions = async () => {
      try {
        setIsLoading(true);

        const response = await fetch(
          `/api/v1/tournaments/${tournamentId}/divisions`,
          {
            credentials: 'include',
          }
        );

        if (response.ok) {
          const data = await response.json();
          setDivisions(data);
          onDivisionsChange?.(data);
        } else {
          console.error('Failed to fetch divisions');
          toast.error('Failed to load divisions');
        }
      } catch (error) {
        console.error('Error fetching divisions:', error);
        toast.error('Failed to load divisions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDivisions();
  }, [tournamentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error('Name is required');
      return;
    }

    if (parseInt(formData.minTeams) >= parseInt(formData.maxTeams)) {
      toast.error('Minimum teams must be less than maximum teams');
      return;
    }

    try {
      setIsSubmitting(true);

      const url = editingDivision
        ? `/api/v1/divisions/${editingDivision.id}`
        : `/api/v1/tournaments/${tournamentId}/divisions`;

      const method = editingDivision ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newDivision = await response.json();

        if (editingDivision) {
          const updatedDivisions = divisions.map((division) =>
            division.id === editingDivision.id ? newDivision : division
          );
          setDivisions(updatedDivisions);
          onDivisionsChange?.(updatedDivisions);
          toast.success('Division updated successfully');
        } else {
          const newDivisions = [...divisions, newDivision];
          setDivisions(newDivisions);
          onDivisionsChange?.(newDivisions);
          toast.success('Division added successfully');
        }

        resetForm();
        setIsDialogOpen(false);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save division');
      }
    } catch (error) {
      console.error('Error saving division:', error);
      toast.error('Failed to save division');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (division: Division) => {
    setEditingDivision(division);
    setFormData({
      name: division.name,
      description: division.description || '',
      birthYear: division.birthYear?.toString() || '',
      format: division.format || '',
      level: division.level,
      minTeams: division.minTeams.toString(),
      maxTeams: division.maxTeams.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (divisionId: string) => {
    if (!confirm('Are you sure you want to delete this division?')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/divisions/${divisionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        const updatedDivisions = divisions.filter(
          (division) => division.id !== divisionId
        );
        setDivisions(updatedDivisions);
        onDivisionsChange?.(updatedDivisions);
        toast.success('Division deleted successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete division');
      }
    } catch (error) {
      console.error('Error deleting division:', error);
      toast.error('Failed to delete division');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      birthYear: '',
      format: '',
      level: 'COMPETITIVE',
      minTeams: '4',
      maxTeams: '16',
    });
    setEditingDivision(null);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'ELITE':
        return <Badge variant="default">Elite</Badge>;
      case 'COMPETITIVE':
        return <Badge variant="secondary">Competitive</Badge>;
      case 'CHALLENGE':
        return <Badge variant="outline">Challenge</Badge>;
      case 'RECREATIONAL':
        return <Badge variant="outline">Recreational</Badge>;
      default:
        return <Badge variant="secondary">{level}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading divisions...</span>
      </div>
    );
  }

  return (
    <Card className="border-0 shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* <Trophy className="h-5 w-5" /> */}
            <span>Divisions</span>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Add Division
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingDivision ? 'Edit Division' : 'Add New Division'}
                </DialogTitle>
                <DialogDescription>
                  {editingDivision
                    ? 'Update the division information below.'
                    : 'Add a new division to this tournament.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Division Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., U12 Boys, U14 Girls"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Enter division description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="birthYear">Birth Year</Label>
                    <Input
                      id="birthYear"
                      type="number"
                      value={formData.birthYear}
                      onChange={(e) =>
                        setFormData({ ...formData, birthYear: e.target.value })
                      }
                      placeholder="e.g., 2012"
                      min="2000"
                      max="2030"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="format">Format</Label>
                    <Select
                      value={formData.format}
                      onValueChange={(value) =>
                        setFormData({ ...formData, format: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5v5">5v5</SelectItem>
                        <SelectItem value="7v7">7v7</SelectItem>
                        <SelectItem value="8v8">8v8</SelectItem>
                        <SelectItem value="11v11">11v11</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                      <SelectItem value="ELITE">Elite</SelectItem>
                      <SelectItem value="COMPETITIVE">Competitive</SelectItem>
                      <SelectItem value="CHALLENGE">Challenge</SelectItem>
                      <SelectItem value="RECREATIONAL">Recreational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minTeams">Minimum Teams</Label>
                    <Input
                      id="minTeams"
                      type="number"
                      value={formData.minTeams}
                      onChange={(e) =>
                        setFormData({ ...formData, minTeams: e.target.value })
                      }
                      placeholder="4"
                      min="2"
                      max="32"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxTeams">Maximum Teams</Label>
                    <Input
                      id="maxTeams"
                      type="number"
                      value={formData.maxTeams}
                      onChange={(e) =>
                        setFormData({ ...formData, maxTeams: e.target.value })
                      }
                      placeholder="16"
                      min="2"
                      max="64"
                    />
                  </div>
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
                      : editingDivision
                        ? 'Update Division'
                        : 'Add Division'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
        {/* <CardDescription>
          Manage tournament divisions and age groups
        </CardDescription> */}
      </CardHeader>
      <CardContent>
        {divisions.length === 0 ? (
          <div className="py-12 text-center">
            <Trophy className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No divisions yet</h3>
            <p className="mb-4 text-muted-foreground">
              Get started by adding the first division to this tournament.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Division
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Division</TableHead>
                  <TableHead>Age Group</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Teams</TableHead>
                  <TableHead>Stages</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {divisions.map((division) => (
                  <TableRow key={division.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{division.name}</div>
                        {division.description && (
                          <div className="text-sm text-muted-foreground">
                            {division.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {division.birthYear ? (
                        <Badge variant="outline">
                          Born {division.birthYear}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {division.format ? (
                        <Badge variant="outline">{division.format}</Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{getLevelBadge(division.level)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span>
                          {division.currentTeams} / {division.maxTeams}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>{division._count.stages}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(division)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(division.id)}
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
