'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Play,
  CheckCircle,
  AlertCircle,
  Trophy,
  Users,
} from 'lucide-react';
import { PlacementSystemSelector } from './placement-system-selector';
import { getAllPlacementSystemTemplates } from '@/lib/tournament/placement-configuration';

interface PlacementSystemConfigProps {
  tournamentId: string;
  divisionId?: string;
  groupIds?: string[];
  currentConfig?: {
    enabled: boolean;
    systemId?: string;
  };
  onConfigChange: (config: { enabled: boolean; systemId?: string }) => void;
  onGenerateMatches?: (systemId: string) => Promise<void>;
  disabled?: boolean;
}

export function PlacementSystemConfig({
  tournamentId,
  divisionId,
  groupIds,
  currentConfig = { enabled: false },
  onConfigChange,
  onGenerateMatches,
  disabled = false,
}: PlacementSystemConfigProps) {
  const [isEnabled, setIsEnabled] = useState(currentConfig.enabled);
  const [selectedSystemId, setSelectedSystemId] = useState(
    currentConfig.systemId || ''
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');

  // Update state when currentConfig changes
  useEffect(() => {
    setIsEnabled(currentConfig.enabled);
    setSelectedSystemId(currentConfig.systemId || '');
  }, [currentConfig]);

  const placementTemplates = getAllPlacementSystemTemplates();
  const selectedSystem = placementTemplates.find(
    (t) => t.id === selectedSystemId
  );

  // Save configuration to database when it changes
  const saveConfiguration = async (config: {
    enabled: boolean;
    systemId?: string;
  }) => {
    if (!divisionId) return;

    try {
      const response = await fetch(
        `/api/v1/tournaments/${tournamentId}/placement-config`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            divisionId,
            placementConfig: config.enabled
              ? {
                  enabled: config.enabled,
                  systemId: config.systemId,
                }
              : null,
          }),
        }
      );

      if (!response.ok) {
        console.error('Failed to save placement configuration');
      }
    } catch (error) {
      console.error('Error saving placement configuration:', error);
    }
  };

  useEffect(() => {
    const config = {
      enabled: isEnabled,
      systemId: isEnabled ? selectedSystemId : undefined,
    };

    onConfigChange(config);
    saveConfiguration(config);
  }, [isEnabled, selectedSystemId, onConfigChange, tournamentId, divisionId]);

  const handleGenerateMatches = async () => {
    if (!selectedSystemId || !onGenerateMatches) return;

    setIsGenerating(true);
    setGenerationStatus('idle');

    try {
      await onGenerateMatches(selectedSystemId);
      setGenerationStatus('success');
    } catch (error) {
      console.error('Error generating placement matches:', error);
      setGenerationStatus('error');
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusIcon = () => {
    switch (generationStatus) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    switch (generationStatus) {
      case 'success':
        return 'Placement matches generated successfully!';
      case 'error':
        return 'Failed to generate placement matches. Please try again.';
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Trophy className="h-5 w-5" />
            <CardTitle className="text-lg">
              Placement Matches (Sijoituspelit)
            </CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="placement-enabled"
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
              disabled={disabled}
            />
            <Label htmlFor="placement-enabled" className="text-sm">
              Enable Placement Matches
            </Label>
          </div>
        </div>
        <CardDescription>
          Configure placement matches to determine final standings after group
          stage
        </CardDescription>
      </CardHeader>

      {isEnabled && (
        <CardContent className="space-y-6">
          {/* System Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Placement System</Label>
              {selectedSystem && (
                <Badge variant="secondary" className="text-xs">
                  {selectedSystem.type.replace('-', ' ').toUpperCase()}
                </Badge>
              )}
            </div>

            <PlacementSystemSelector
              selectedSystemId={selectedSystemId}
              onSystemSelect={setSelectedSystemId}
              disabled={disabled}
            />
          </div>

          {/* Selected System Details */}
          {selectedSystem && (
            <Card className="bg-muted/50">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <CardTitle className="text-sm">
                    Selected System: {selectedSystem.name}
                  </CardTitle>
                </div>
                <CardDescription className="text-xs">
                  {selectedSystem.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground">Brackets:</span>
                      <span className="ml-2 font-medium">
                        {selectedSystem.brackets.length}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <span className="ml-2 font-medium capitalize">
                        {selectedSystem.type.replace('-', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Bracket Details */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Brackets:</Label>
                    <div className="space-y-1">
                      {selectedSystem.brackets.map((bracket) => (
                        <div
                          key={bracket.id}
                          className="flex items-center justify-between rounded bg-background p-2 text-xs"
                        >
                          <div>
                            <span className="font-medium">{bracket.name}</span>
                            <span className="ml-2 text-muted-foreground">
                              ({bracket.positions.join(', ')})
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {bracket.matchFormat}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cross-group indicator */}
                  {selectedSystem.crossGroupMatching?.enabled && (
                    <div className="flex items-center space-x-2 rounded bg-blue-50 p-2 text-xs text-blue-600">
                      <Users className="h-3 w-3" />
                      <span>Cross-group placement matches enabled</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Generate Matches Section */}
          {selectedSystemId && onGenerateMatches && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">
                    Generate Placement Matches
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Create placement matches based on current group standings
                  </p>
                </div>
                <Button
                  onClick={handleGenerateMatches}
                  disabled={disabled || isGenerating || !selectedSystemId}
                  className="flex items-center space-x-2"
                >
                  <Play className="h-4 w-4" />
                  <span>
                    {isGenerating ? 'Generating...' : 'Generate Matches'}
                  </span>
                </Button>
              </div>

              {/* Generation Status */}
              {generationStatus !== 'idle' && (
                <div
                  className={`flex items-center space-x-2 rounded-lg p-3 ${
                    generationStatus === 'success'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {getStatusIcon()}
                  <span className="text-sm">{getStatusMessage()}</span>
                </div>
              )}

              {/* Tournament Info */}
              <div className="space-y-1 text-xs text-muted-foreground">
                <div>Tournament: {tournamentId}</div>
                {divisionId && <div>Division: {divisionId}</div>}
                {groupIds && groupIds.length > 0 && (
                  <div>Groups: {groupIds.length} selected</div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
