'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface MatchEventFormProps {
  matchId: string;
  homeTeam: {
    id: string;
    name: string;
  } | null;
  awayTeam: {
    id: string;
    name: string;
  } | null;
  onEventAdded: () => void;
  onClose: () => void;
}

export function MatchEventForm({
  matchId,
  homeTeam,
  awayTeam,
  onEventAdded,
  onClose,
}: MatchEventFormProps) {
  const [minute, setMinute] = useState('');
  const [eventType, setEventType] = useState('');
  const [teamId, setTeamId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!minute || !eventType || !teamId) {
      toast.error('Validation Error', {
        description: 'Please fill in all required fields',
      });
      return;
    }

    const minuteNum = parseInt(minute);
    if (isNaN(minuteNum) || minuteNum < 0 || minuteNum > 120) {
      toast.error('Validation Error', {
        description: 'Minute must be between 0 and 120',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await api.matches.createEvent(matchId, {
        minute: minuteNum,
        type: eventType,
        teamId: teamId,
      });
      toast.success('Event added', {
        description: 'Match event has been added successfully.',
      });
      onEventAdded();
    } catch (error: any) {
      toast.error('Error', {
        description: error.message || 'Failed to add event',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableTeams = [
    homeTeam && { id: homeTeam.id, name: homeTeam.name },
    awayTeam && { id: awayTeam.id, name: awayTeam.name },
  ].filter(Boolean) as Array<{ id: string; name: string }>;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Match Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="minute">Minute *</Label>
            <Input
              id="minute"
              type="number"
              min="0"
              max="120"
              value={minute}
              onChange={(e) => setMinute(e.target.value)}
              placeholder="e.g., 15"
              required
            />
          </div>

          <div>
            <Label htmlFor="eventType">Event Type *</Label>
            <Select value={eventType} onValueChange={setEventType} required>
              <SelectTrigger>
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GOAL">
                  <div className="flex items-center gap-2">
                    <span>⚽</span>
                    <span>Goal</span>
                  </div>
                </SelectItem>
                <SelectItem value="PENALTY_GOAL">
                  <div className="flex items-center gap-2">
                    <span>⚽</span>
                    <span>Penalty Goal</span>
                  </div>
                </SelectItem>
                <SelectItem value="OWN_GOAL">
                  <div className="flex items-center gap-2">
                    <span>🥅</span>
                    <span>Own Goal</span>
                  </div>
                </SelectItem>
                <SelectItem value="CARD_YELLOW">
                  <div className="flex items-center gap-2">
                    <span>🟨</span>
                    <span>Yellow Card</span>
                  </div>
                </SelectItem>
                <SelectItem value="CARD_RED">
                  <div className="flex items-center gap-2">
                    <span>🟥</span>
                    <span>Red Card</span>
                  </div>
                </SelectItem>
                <SelectItem value="SUBSTITUTION">
                  <div className="flex items-center gap-2">
                    <span>🔄</span>
                    <span>Substitution</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="team">Team *</Label>
            <Select value={teamId} onValueChange={setTeamId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                {availableTeams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

