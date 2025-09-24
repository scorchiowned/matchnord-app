'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DivisionFormatConfiguration, 
  TournamentFormatTemplate,
  createDivisionFormatFromTemplate
} from '@/lib/tournament/format-configuration';
import { FormatTemplateSelector } from './format-template-selector';
import { FormatConfiguration } from './format-configuration';
import { 
  ArrowLeft, 
  Settings, 
  CheckCircle, 
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface FormatManagementProps {
  divisionId: string;
  divisionName: string;
  teamCount: number;
  onFormatChange: (config: DivisionFormatConfiguration) => void;
  onGenerateMatches: (phaseId: string) => void;
  disabled?: boolean;
}

type ViewMode = 'template-selector' | 'format-configuration' | 'loading';

export function FormatManagement({
  divisionId,
  divisionName,
  teamCount,
  onFormatChange,
  onGenerateMatches,
  disabled = false
}: FormatManagementProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('loading');
  const [formatConfig, setFormatConfig] = useState<DivisionFormatConfiguration | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkExistingFormat();
  }, [divisionId]);

  const checkExistingFormat = async () => {
    try {
      const response = await fetch(`/api/v1/divisions/${divisionId}/format`);
      if (response.ok) {
        const data = await response.json();
        if (data.formatConfig) {
          setFormatConfig(data.formatConfig);
          setViewMode('format-configuration');
        } else {
          setViewMode('template-selector');
        }
      } else {
        setViewMode('template-selector');
      }
    } catch (err) {
      setError('Failed to check existing format configuration');
      setViewMode('template-selector');
    }
  };

  const handleTemplateSelect = (template: TournamentFormatTemplate) => {
    setSelectedTemplate(template.id);
    
    // Create format configuration from template
    const config = createDivisionFormatFromTemplate(template.id, divisionId);
    if (config) {
      setFormatConfig(config);
      setViewMode('format-configuration');
      onFormatChange(config);
      toast.success(`Selected ${template.name} format`);
    } else {
      toast.error('Failed to create format configuration from template');
    }
  };

  const handleCustomFormat = () => {
    // Create a basic custom format configuration
    const customConfig: DivisionFormatConfiguration = {
      divisionId,
      format: 'custom',
      phases: [
        {
          id: `${divisionId}-group-1`,
          type: 'group',
          name: 'Group Stage',
          description: 'Custom group stage configuration',
          order: 1,
          enabled: true,
          groupSettings: {
            minTeamsPerGroup: 4,
            maxTeamsPerGroup: 8,
            teamsAdvance: 2,
            tiebreakerRules: ['points', 'goal-difference', 'goals-scored', 'head-to-head']
          }
        }
      ]
    };
    
    setFormatConfig(customConfig);
    setViewMode('format-configuration');
    onFormatChange(customConfig);
    toast.success('Created custom format configuration');
  };

  const handleFormatChange = (config: DivisionFormatConfiguration) => {
    setFormatConfig(config);
    onFormatChange(config);
  };

  const handleBackToTemplates = () => {
    setViewMode('template-selector');
    setSelectedTemplate(null);
    setFormatConfig(null);
  };

  const getStatusBadge = () => {
    if (!formatConfig) return null;
    
    const enabledPhases = formatConfig.phases.filter(phase => phase.enabled);
    const phaseCount = enabledPhases.length;
    
    if (phaseCount === 0) {
      return <Badge variant="destructive">No phases enabled</Badge>;
    } else if (phaseCount === 1) {
      return <Badge variant="default">Single phase</Badge>;
    } else {
      return <Badge variant="default">{phaseCount} phases</Badge>;
    }
  };

  if (viewMode === 'loading') {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading format management...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tournament Format</h1>
          <p className="text-gray-600">
            Configure the format for {divisionName} ({teamCount} teams)
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge()}
          {viewMode === 'format-configuration' && (
            <Button
              onClick={handleBackToTemplates}
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Change Format
            </Button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Template Selector View */}
      {viewMode === 'template-selector' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Choose Tournament Format</span>
            </CardTitle>
            <CardDescription>
              Select a predefined format template or create a custom configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormatTemplateSelector
              teamCount={teamCount}
              onTemplateSelect={handleTemplateSelect}
              onCustomFormat={handleCustomFormat}
              selectedTemplate={selectedTemplate}
              disabled={disabled}
            />
          </CardContent>
        </Card>
      )}

      {/* Format Configuration View */}
      {viewMode === 'format-configuration' && formatConfig && (
        <FormatConfiguration
          divisionId={divisionId}
          divisionName={divisionName}
          teamCount={teamCount}
          onFormatChange={handleFormatChange}
          onGenerateMatches={onGenerateMatches}
          disabled={disabled}
        />
      )}

      {/* Quick Actions */}
      {viewMode === 'format-configuration' && formatConfig && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span>Quick Actions</span>
            </CardTitle>
            <CardDescription>
              Common actions for your tournament format
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={() => {
                  const firstPhase = formatConfig.phases.find(p => p.enabled);
                  if (firstPhase) {
                    onGenerateMatches(firstPhase.id);
                  }
                }}
                disabled={disabled || !formatConfig.phases.some(p => p.enabled)}
                className="h-20 flex-col space-y-2"
              >
                <Settings className="h-6 w-6" />
                <span>Generate All Matches</span>
              </Button>
              
              <Button
                onClick={() => {
                  // TODO: Implement preview functionality
                  toast.info('Preview functionality coming soon');
                }}
                disabled={disabled}
                variant="outline"
                className="h-20 flex-col space-y-2"
              >
                <CheckCircle className="h-6 w-6" />
                <span>Preview Format</span>
              </Button>
              
              <Button
                onClick={() => {
                  // TODO: Implement export functionality
                  toast.info('Export functionality coming soon');
                }}
                disabled={disabled}
                variant="outline"
                className="h-20 flex-col space-y-2"
              >
                <CheckCircle className="h-6 w-6" />
                <span>Export Configuration</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

