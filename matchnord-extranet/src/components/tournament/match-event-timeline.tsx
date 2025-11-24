'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Edit } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface MatchEvent {
  id: string;
  minute: number;
  type: string;
  team: {
    id: string;
    name: string;
  } | null;
}

interface MatchEventTimelineProps {
  matchId: string;
  events: MatchEvent[];
  homeTeamId?: string | null;
  awayTeamId?: string | null;
  onEventUpdate: () => void;
}

export function MatchEventTimeline({
  matchId,
  events,
  homeTeamId,
  awayTeamId,
  onEventUpdate,
}: MatchEventTimelineProps) {

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'GOAL':
      case 'PENALTY_GOAL':
        return '⚽';
      case 'OWN_GOAL':
        return '🥅';
      case 'CARD_YELLOW':
        return '🟨';
      case 'CARD_RED':
        return '🟥';
      case 'SUBSTITUTION':
        return '🔄';
      default:
        return '•';
    }
  };

  const getEventLabel = (type: string) => {
    switch (type) {
      case 'GOAL':
        return 'Goal';
      case 'PENALTY_GOAL':
        return 'Penalty Goal';
      case 'OWN_GOAL':
        return 'Own Goal';
      case 'CARD_YELLOW':
        return 'Yellow Card';
      case 'CARD_RED':
        return 'Red Card';
      case 'SUBSTITUTION':
        return 'Substitution';
      default:
        return type;
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      await api.matches.deleteEvent(matchId, eventId);
      toast.success('Event deleted', {
        description: 'Match event has been deleted successfully.',
      });
      onEventUpdate();
    } catch (error: any) {
      toast.error('Error', {
        description: error.message || 'Failed to delete event',
      });
    }
  };

  if (events.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <p>No events recorded for this match yet.</p>
        <p className="text-sm mt-2">
          Add events when the match is live to track goals, cards, and
          substitutions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => {
        const isHomeTeam =
          homeTeamId && event.team?.id === homeTeamId;
        const isAwayTeam =
          awayTeamId && event.team?.id === awayTeamId;

        return (
          <div
            key={event.id}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="min-w-[60px] text-center">
                <div className="text-lg font-bold">{event.minute}&apos;</div>
              </div>
              <div className="text-2xl">{getEventIcon(event.type)}</div>
              <div className="flex-1">
                <div className="font-medium">{getEventLabel(event.type)}</div>
                {event.team && (
                  <div className="text-sm text-muted-foreground">
                    {event.team.name}
                  </div>
                )}
              </div>
              {event.team && (
                <Badge
                  variant={
                    isHomeTeam
                      ? 'default'
                      : isAwayTeam
                      ? 'secondary'
                      : 'outline'
                  }
                >
                  {event.team.name}
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDeleteEvent(event.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

