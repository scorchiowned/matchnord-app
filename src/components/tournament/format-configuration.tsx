'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DivisionFormatConfiguration, 
  PhaseConfiguration,
  TournamentFormatTemplate,
  getFormatDisplayInfo,
  calculateEstimatedMatches
} from '@/lib/tournament/format-configuration';
import { 
  Loader2, 
  CheckCircle, 
  AlertTriangle, 
  Settings, 
  Users, 
  Clock,
  Trophy,
  Play,
  Target
} from 'lucide-react';
import { toast } from 'sonner';

interface FormatConfigurationProps {
  divisionId: string;
  divisionName: string;
  teamCount: number;
  onFormatChange: (config: DivisionFormatConfiguration) => void;
  onGenerateMatches: (phaseId: string) => void;
  disabled?: boolean;
}

export function FormatConfiguration({
  divisionId,
  divisionName,
  teamCount,
  onFormatChange,
  onGenerateMatches,
  disabled = false
}: FormatConfigurationProps) {
  const [formatConfig, setFormatConfig] = useState<DivisionFormatConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);

  useEffect(() => {
    fetchFormatConfig();
  }, [divisionId]);

  const fetchFormatConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/v1/divisions/${divisionId}/format`);
      if (!response.ok) {
        throw new Error('Failed to fetch format configuration');
      }
      
      const data = await response.json();
      setFormatConfig(data.formatConfig);
      setWarnings(data.warnings || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch format configuration');
    } finally {
      setLoading(false);
    }
  };

  const saveFormatConfig = async (config: DivisionFormatConfiguration) => {
    try {
      setSaving(true);
      setError(null);
      
      const response = await fetch(`/api/v1/divisions/${divisionId}/format`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ formatConfig: config }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save format configuration');
      }
      
      const data = await response.json();
      setFormatConfig(data.formatConfig);
      setWarnings(data.warnings || []);
      onFormatChange(data.formatConfig);
      toast.success('Format configuration saved successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save format configuration';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const updatePhase = (phaseId: string, updates: Partial<PhaseConfiguration>) => {
    if (!formatConfig) return;
    
    const updatedPhases = formatConfig.phases.map(phase =>
      phase.id === phaseId ? { ...phase, ...updates } : phase
    );
    
    const updatedConfig = {
      ...formatConfig,
      phases: updatedPhases
    };
    
    setFormatConfig(updatedConfig);
  };

  const addPhase = () => {
    if (!formatConfig) return;
    
    const newPhase: PhaseConfiguration = {
      id: `phase-${Date.now()}`,
      type: 'group',
      name: 'New Phase',
      description: '',
      order: formatConfig.phases.length + 1,
      enabled: true,
      groupSettings: {
        minTeamsPerGroup: 4,
        maxTeamsPerGroup: 8,
        teamsAdvance: 2,
        tiebreakerRules: ['points', 'goal-difference', 'goals-scored', 'head-to-head']
      }
    };
    
    const updatedConfig = {
      ...formatConfig,
      phases: [...formatConfig.phases, newPhase]
    };
    
    setFormatConfig(updatedConfig);
  };

  const removePhase = (phaseId: string) => {
    if (!formatConfig) return;
    
    const updatedPhases = formatConfig.phases.filter(phase => phase.id !== phaseId);
    const updatedConfig = {
      ...formatConfig,
      phases: updatedPhases
    };
    
    setFormatConfig(updatedConfig);
  };

  const getPhaseIcon = (type: string) => {
    switch (type) {
      case 'group': return <Users className="h-4 w-4" />;
      case 'knockout': return <Trophy className="h-4 w-4" />;
      case 'playoff': return <Target className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getPhaseColor = (type: string) => {
    switch (type) {
      case 'group': return 'bg-blue-100 text-blue-800';
      case 'knockout': return 'bg-red-100 text-red-800';
      case 'playoff': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading format configuration...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchFormatConfig} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (!formatConfig) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600 mb-4">No format configuration found</p>
        <Button onClick={() => setFormatConfig({
          divisionId,
          format: 'custom',
          phases: []
        })}>
          Create Format Configuration
        </Button>
      </div>
    );
  }

  const estimatedMatches = calculateEstimatedMatches(teamCount, formatConfig);
  const enabledPhases = formatConfig.phases.filter(phase => phase.enabled);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{divisionName} Format</h2>
          <p className="text-gray-600">
            {teamCount} teams • {estimatedMatches} estimated matches
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => saveFormatConfig(formatConfig)}
            disabled={disabled || saving}
            size="sm"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Save
          </Button>
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Format Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span className="text-2xl">{getFormatIcon(formatConfig.format)}</span>
            <span>{getFormatDisplayInfo(formatConfig.format).name}</span>
          </CardTitle>
          <CardDescription>
            {getFormatDisplayInfo(formatConfig.format).description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Teams</p>
                <p className="text-2xl font-bold">{teamCount}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Play className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Estimated Matches</p>
                <p className="text-2xl font-bold">{estimatedMatches}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Phases</p>
                <p className="text-2xl font-bold">{enabledPhases.length}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phases Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tournament Phases</CardTitle>
              <CardDescription>
                Configure the phases of your tournament
              </CardDescription>
            </div>
            <Button onClick={addPhase} disabled={disabled} size="sm">
              Add Phase
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedPhase || formatConfig.phases[0]?.id} onValueChange={setSelectedPhase}>
            <TabsList className="grid w-full grid-cols-1 md:grid-cols-3">
              {formatConfig.phases.map((phase) => (
                <TabsTrigger key={phase.id} value={phase.id} className="flex items-center space-x-2">
                  {getPhaseIcon(phase.type)}
                  <span>{phase.name}</span>
                  {!phase.enabled && <Badge variant="secondary" className="ml-1">Disabled</Badge>}
                </TabsTrigger>
              ))}
            </TabsList>

            {formatConfig.phases.map((phase) => (
              <TabsContent key={phase.id} value={phase.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge className={getPhaseColor(phase.type)}>
                      {phase.type.toUpperCase()}
                    </Badge>
                    <span className="font-medium">{phase.name}</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => onGenerateMatches(phase.id)}
                      disabled={disabled || !phase.enabled}
                      size="sm"
                      variant="outline"
                    >
                      Generate Matches
                    </Button>
                    <Button
                      onClick={() => removePhase(phase.id)}
                      disabled={disabled}
                      size="sm"
                      variant="destructive"
                    >
                      Remove
                    </Button>
                  </div>
                </div>

                {/* Phase Basic Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`${phase.id}-name`}>Phase Name</Label>
                    <Input
                      id={`${phase.id}-name`}
                      value={phase.name}
                      onChange={(e) => updatePhase(phase.id, { name: e.target.value })}
                      disabled={disabled}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`${phase.id}-order`}>Order</Label>
                    <Input
                      id={`${phase.id}-order`}
                      type="number"
                      value={phase.order}
                      onChange={(e) => updatePhase(phase.id, { order: parseInt(e.target.value) })}
                      disabled={disabled}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor={`${phase.id}-description`}>Description</Label>
                  <Input
                    id={`${phase.id}-description`}
                    value={phase.description || ''}
                    onChange={(e) => updatePhase(phase.id, { description: e.target.value })}
                    disabled={disabled}
                    placeholder="Optional description for this phase"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id={`${phase.id}-enabled`}
                    checked={phase.enabled}
                    onCheckedChange={(checked) => updatePhase(phase.id, { enabled: checked })}
                    disabled={disabled}
                  />
                  <Label htmlFor={`${phase.id}-enabled`}>Enable this phase</Label>
                </div>

                {/* Phase-specific settings will be added in the next step */}
                {phase.type === 'group' && phase.groupSettings && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium mb-2">Group Settings</h4>
                    <p className="text-sm text-gray-600">
                      Group-specific settings will be configured here
                    </p>
                  </div>
                )}

                {phase.type === 'knockout' && phase.knockoutSettings && (
                  <div className="p-4 bg-red-50 rounded-lg">
                    <h4 className="font-medium mb-2">Knockout Settings</h4>
                    <p className="text-sm text-gray-600">
                      Knockout-specific settings will be configured here
                    </p>
                  </div>
                )}

                {phase.type === 'playoff' && phase.playoffSettings && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium mb-2">Playoff Settings</h4>
                    <p className="text-sm text-gray-600">
                      Playoff-specific settings will be configured here
                    </p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

