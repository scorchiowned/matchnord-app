'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Lock,
  Unlock,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Users,
  Trophy,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  canLockDivision,
  canLockTournament,
  generateDivisionLockStatus,
  generateTournamentLockStatus,
  validateDivisionForLock,
  validateTournamentForLock,
  getValidationSummary,
} from '@/lib/tournament/tournament-lock';

interface Team {
  id: string;
  name: string;
  level?: string;
}

interface Group {
  id: string;
  name: string;
  teams: Team[];
}

interface Division {
  id: string;
  name: string;
  level?: string;
  isLocked: boolean;
  lockedAt?: string;
  lockedBy?: string;
  groups: Group[];
  teams: Team[];
}

interface LockManagementProps {
  tournamentId: string;
  divisions: Division[];
  onLockChange?: () => void;
}

export function LockManagement({
  tournamentId,
  divisions,
  onLockChange,
}: LockManagementProps) {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);
  const [lockStatus, setLockStatus] = useState<any>(null);

  // Calculate lock status for each division
  useEffect(() => {
    if (divisions.length === 0) return;

    const divisionStatuses = divisions.map((division) => {
      // Transform the data structure to match what validation expects
      const divisionForValidation = {
        ...division,
        groups: division.groups.map((group) => ({
          ...group,
          division: {
            id: division.id,
            name: division.name,
            level: division.level,
          },
        })),
      };

      const validation = validateDivisionForLock(divisionForValidation);
      return generateDivisionLockStatus({
        ...division,
        isLocked: division.isLocked,
        lockedAt: division.lockedAt ? new Date(division.lockedAt) : undefined,
        lockedBy: division.lockedBy,
        groups: division.groups.map((group) => ({
          id: group.id,
          name: group.name,
          teams: group.teams,
        })),
      });
    });

    const tournamentStatus = generateTournamentLockStatus(
      tournamentId,
      divisionStatuses,
      divisionStatuses.every((div) => div.isLocked),
      undefined,
      undefined
    );

    setLockStatus(tournamentStatus);
  }, [divisions, tournamentId]);

  const handleLockDivision = async (divisionId: string) => {
    try {
      setIsLoading(true);

      const response = await fetch(`/api/v1/divisions/${divisionId}/lock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Division locked successfully');
        onLockChange?.();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to lock division');
      }
    } catch (error) {
      console.error('Error locking division:', error);
      toast.error('Failed to lock division');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlockDivision = async (divisionId: string) => {
    try {
      setIsLoading(true);

      const response = await fetch(`/api/v1/divisions/${divisionId}/unlock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Division unlocked successfully');
        onLockChange?.();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to unlock division');
      }
    } catch (error) {
      console.error('Error unlocking division:', error);
      toast.error('Failed to unlock division');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLockTournament = async () => {
    try {
      setIsLoading(true);

      const response = await fetch(`/api/v1/tournaments/${tournamentId}/lock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Tournament locked successfully');
        onLockChange?.();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to lock tournament');
      }
    } catch (error) {
      console.error('Error locking tournament:', error);
      toast.error('Failed to lock tournament');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlockTournament = async () => {
    try {
      setIsLoading(true);

      const response = await fetch(
        `/api/v1/tournaments/${tournamentId}/unlock`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

      if (response.ok) {
        toast.success('Tournament unlocked successfully');
        onLockChange?.();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to unlock tournament');
      }
    } catch (error) {
      console.error('Error unlocking tournament:', error);
      toast.error('Failed to unlock tournament');
    } finally {
      setIsLoading(false);
    }
  };

  if (!lockStatus) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="mb-2 h-4 w-1/4 rounded bg-gray-200"></div>
          <div className="h-32 rounded bg-gray-200"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tournament Lock Status */}
      <Card
        className={
          lockStatus.isFullyLocked
            ? 'border-green-200 bg-green-50'
            : 'border-orange-200 bg-orange-50'
        }
      >
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {lockStatus.isFullyLocked ? (
              <Lock className="h-5 w-5 text-green-600" />
            ) : (
              <Unlock className="h-5 w-5 text-orange-600" />
            )}
            <span>Tournament Lock Status</span>
            <Badge variant={lockStatus.isFullyLocked ? 'default' : 'secondary'}>
              {lockStatus.isFullyLocked ? 'Locked' : 'Unlocked'}
            </Badge>
          </CardTitle>
          <CardDescription>
            {lockStatus.isFullyLocked
              ? 'Tournament is locked and ready for match generation'
              : 'Lock divisions to enable match generation'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Locked Divisions:{' '}
                {lockStatus.divisions.filter((d: any) => d.isLocked).length} /{' '}
                {lockStatus.divisions.length}
              </p>
              {lockStatus.lockedAt && (
                <p className="text-xs text-muted-foreground">
                  Locked at: {new Date(lockStatus.lockedAt).toLocaleString()}
                </p>
              )}
            </div>
            <div className="space-x-2">
              {lockStatus.isFullyLocked ? (
                <Button
                  variant="outline"
                  onClick={handleUnlockTournament}
                  disabled={isLoading}
                  className="text-red-600 hover:text-red-700"
                >
                  <Unlock className="mr-2 h-4 w-4" />
                  Unlock Tournament
                </Button>
              ) : (
                <Button
                  onClick={handleLockTournament}
                  disabled={isLoading || !lockStatus.canUnlock}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Lock Tournament
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Division Lock Status */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Division Lock Status</h3>
        {lockStatus.divisions.map((division: any) => {
          const divisionData = divisions.find(
            (d) => d.id === division.divisionId
          )!;
          // Transform the data structure to match what validation expects
          const divisionForValidation = {
            ...divisionData,
            groups: divisionData.groups.map((group) => ({
              ...group,
              division: {
                id: divisionData.id,
                name: divisionData.name,
                level: divisionData.level,
              },
            })),
          };
          const validation = validateDivisionForLock(divisionForValidation);
          const summary = getValidationSummary(validation);

          return (
            <Card
              key={division.divisionId}
              className={
                division.isLocked ? 'border-green-200' : 'border-gray-200'
              }
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-5 w-5" />
                    <span>{division.divisionName}</span>
                    <Badge
                      variant={division.isLocked ? 'default' : 'secondary'}
                    >
                      {division.isLocked ? 'Locked' : 'Unlocked'}
                    </Badge>
                    <Badge variant="outline">
                      {division.groupsCount} groups
                    </Badge>
                    <Badge variant="outline">{division.teamsCount} teams</Badge>
                  </div>
                  <div className="space-x-2">
                    {division.isLocked ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleUnlockDivision(division.divisionId)
                        }
                        disabled={isLoading}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Unlock className="mr-2 h-4 w-4" />
                        Unlock
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleLockDivision(division.divisionId)}
                        disabled={isLoading || !division.canUnlock}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Lock className="mr-2 h-4 w-4" />
                        Lock
                      </Button>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Validation Status */}
                  <div className="flex items-center space-x-2">
                    {summary.status === 'valid' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : summary.status === 'warning' ? (
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        summary.status === 'valid'
                          ? 'text-green-600'
                          : summary.status === 'warning'
                            ? 'text-yellow-600'
                            : 'text-red-600'
                      }`}
                    >
                      {summary.message}
                    </span>
                  </div>

                  {/* Validation Details */}
                  {summary.details.length > 0 && (
                    <Alert
                      className={
                        summary.status === 'error'
                          ? 'border-red-200 bg-red-50'
                          : 'border-yellow-200 bg-yellow-50'
                      }
                    >
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <ul className="list-inside list-disc space-y-1">
                          {summary.details.map((detail, index) => (
                            <li key={index} className="text-sm">
                              {detail}
                            </li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Division Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Groups:</span>{' '}
                      {division.groupsCount}
                    </div>
                    <div>
                      <span className="font-medium">Teams:</span>{' '}
                      {division.teamsCount}
                    </div>
                    {division.lockedAt && (
                      <div className="col-span-2">
                        <span className="font-medium">Locked at:</span>{' '}
                        {new Date(division.lockedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
