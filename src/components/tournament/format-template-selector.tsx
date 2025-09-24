'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  TournamentFormatTemplate, 
  getFormatDisplayInfo,
  TournamentFormat 
} from '@/lib/tournament/format-configuration';
import { Loader2, CheckCircle, Clock, Users, Trophy } from 'lucide-react';

interface FormatTemplateSelectorProps {
  teamCount: number;
  onTemplateSelect: (template: TournamentFormatTemplate) => void;
  onCustomFormat: () => void;
  selectedTemplate?: string;
  disabled?: boolean;
}

export function FormatTemplateSelector({
  teamCount,
  onTemplateSelect,
  onCustomFormat,
  selectedTemplate,
  disabled = false
}: FormatTemplateSelectorProps) {
  const [templates, setTemplates] = useState<TournamentFormatTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, [teamCount]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/v1/tournament-formats?teamCount=${teamCount}`);
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  const getFormatIcon = (format: TournamentFormat) => {
    const { icon } = getFormatDisplayInfo(format);
    return icon;
  };

  const getDurationText = (template: TournamentFormatTemplate) => {
    const { minDays, maxDays, estimatedDays } = template.duration;
    if (minDays === maxDays) {
      return `${minDays} day${minDays !== 1 ? 's' : ''}`;
    }
    return `${minDays}-${maxDays} days (est. ${estimatedDays})`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading format templates...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchTemplates} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600 mb-4">
          No suitable templates found for {teamCount} teams
        </p>
        <Button onClick={onCustomFormat} disabled={disabled}>
          Create Custom Format
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">
          Choose Tournament Format
        </h3>
        <p className="text-gray-600">
          Select a format suitable for {teamCount} teams
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => (
          <Card 
            key={template.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedTemplate === template.id 
                ? 'ring-2 ring-blue-500 border-blue-500' 
                : 'hover:border-gray-300'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => !disabled && onTemplateSelect(template)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getFormatIcon(template.format)}</span>
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {template.description}
                    </CardDescription>
                  </div>
                </div>
                {selectedTemplate === template.id && (
                  <CheckCircle className="h-5 w-5 text-blue-500" />
                )}
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3">
                {/* Team count range */}
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>
                    {template.minTeams}-{template.maxTeams} teams
                  </span>
                </div>

                {/* Duration */}
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{getDurationText(template)}</span>
                </div>

                {/* Phases */}
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-700">Phases:</p>
                  <div className="flex flex-wrap gap-1">
                    {template.phases.map((phase) => (
                      <Badge 
                        key={phase.id} 
                        variant={phase.enabled ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {phase.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Suitable for */}
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-700">Suitable for:</p>
                  <div className="flex flex-wrap gap-1">
                    {template.suitableFor.map((use) => (
                      <Badge key={use} variant="outline" className="text-xs">
                        {use}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center pt-4">
        <Button 
          onClick={onCustomFormat} 
          variant="outline"
          disabled={disabled}
          className="w-full md:w-auto"
        >
          <Trophy className="h-4 w-4 mr-2" />
          Create Custom Format
        </Button>
      </div>
    </div>
  );
}

