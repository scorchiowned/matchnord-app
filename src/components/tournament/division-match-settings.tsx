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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Clock, Settings, Save } from 'lucide-react';
import { toast } from 'sonner';

interface DivisionMatchSettingsProps {
  divisionId: string;
  initialSettings?: {
    matchDuration: number;
    breakDuration: number;
    assignmentType: 'AUTO' | 'MANUAL';
  };
  onSettingsChange?: (settings: any) => void;
}

export function DivisionMatchSettings({
  divisionId,
  initialSettings,
  onSettingsChange,
}: DivisionMatchSettingsProps) {
  const [settings, setSettings] = useState({
    matchDuration: initialSettings?.matchDuration || 90,
    breakDuration: initialSettings?.breakDuration || 15,
    assignmentType: initialSettings?.assignmentType || 'AUTO',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const response = await fetch(`/api/v1/divisions/${divisionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          matchDuration: settings.matchDuration,
          breakDuration: settings.breakDuration,
          assignmentType: settings.assignmentType,
        }),
      });

      if (response.ok) {
        toast.success('Match settings updated successfully');
        onSettingsChange?.(settings);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDurationChange = (
    field: 'matchDuration' | 'breakDuration',
    value: string
  ) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0) {
      setSettings((prev) => ({
        ...prev,
        [field]: numValue,
      }));
    }
  };

  const getTotalTimePerMatch = () => {
    return settings.matchDuration + settings.breakDuration;
  };

  const getRecommendedBreaks = () => {
    const matchDuration = settings.matchDuration;
    if (matchDuration <= 30) return 5;
    if (matchDuration <= 60) return 10;
    if (matchDuration <= 90) return 15;
    return 20;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>Match Settings</span>
        </CardTitle>
        <CardDescription>
          Configure match duration, breaks, and assignment preferences for this
          division
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Match Duration */}
        <div className="space-y-2">
          <Label htmlFor="matchDuration" className="text-sm font-medium">
            Match Duration (minutes)
          </Label>
          <div className="flex items-center space-x-2">
            <Input
              id="matchDuration"
              type="number"
              min="15"
              max="180"
              value={settings.matchDuration}
              onChange={(e) =>
                handleDurationChange('matchDuration', e.target.value)
              }
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">minutes</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Recommended: 30-45 min for youth, 60-90 min for adults
          </div>
        </div>

        {/* Break Duration */}
        <div className="space-y-2">
          <Label htmlFor="breakDuration" className="text-sm font-medium">
            Break Between Matches (minutes)
          </Label>
          <div className="flex items-center space-x-2">
            <Input
              id="breakDuration"
              type="number"
              min="0"
              max="60"
              value={settings.breakDuration}
              onChange={(e) =>
                handleDurationChange('breakDuration', e.target.value)
              }
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">minutes</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Recommended: {getRecommendedBreaks()} minutes for{' '}
            {settings.matchDuration}-minute matches
          </div>
        </div>

        {/* Assignment Type */}
        <div className="space-y-2">
          <Label htmlFor="assignmentType" className="text-sm font-medium">
            Match Assignment
          </Label>
          <Select
            value={settings.assignmentType}
            onValueChange={(value: 'AUTO' | 'MANUAL') =>
              setSettings((prev) => ({ ...prev, assignmentType: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MANUAL">
                <div className="flex flex-col">
                  <span>Manual</span>
                  <span className="text-xs text-muted-foreground">
                    Manually assign matches using drag-and-drop interface
                  </span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary */}
        <div className="rounded-lg bg-muted p-4">
          <h4 className="mb-2 text-sm font-medium">Schedule Summary</h4>
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Match duration:</span>
              <span>{settings.matchDuration} minutes</span>
            </div>
            <div className="flex justify-between">
              <span>Break duration:</span>
              <span>{settings.breakDuration} minutes</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Total time per match:</span>
              <span>{getTotalTimePerMatch()} minutes</span>
            </div>
            <div className="flex justify-between">
              <span>Assignment method:</span>
              <span className="capitalize">
                {settings.assignmentType.toLowerCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
