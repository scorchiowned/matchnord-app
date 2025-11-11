'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Trophy,
  Users,
  Target,
  Award,
  Settings,
  CheckCircle,
  Info,
} from 'lucide-react';
import {
  PlacementSystemConfiguration,
  getAllPlacementSystemTemplates,
  getPlacementSystemTemplatesByType,
  PlacementSystemType,
} from '@/lib/tournament/placement-configuration';

interface PlacementSystemSelectorProps {
  selectedSystemId?: string;
  onSystemSelect: (systemId: string) => void;
  disabled?: boolean;
}

export function PlacementSystemSelector({
  selectedSystemId,
  onSystemSelect,
  disabled = false,
}: PlacementSystemSelectorProps) {
  const [selectedType, setSelectedType] = useState<PlacementSystemType | 'all'>(
    'all'
  );
  const [showDetails, setShowDetails] = useState<string | null>(null);

  const allTemplates = getAllPlacementSystemTemplates();
  const filteredTemplates =
    selectedType === 'all'
      ? allTemplates
      : getPlacementSystemTemplatesByType(selectedType);

  const getSystemIcon = (type: PlacementSystemType) => {
    switch (type) {
      case 'simple-placement':
        return <Target className="h-4 w-4" />;
      case 'tiered-brackets':
        return <Award className="h-4 w-4" />;
      case 'cross-group':
        return <Users className="h-4 w-4" />;
      case 'swiss-style':
        return <Trophy className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const getSystemDescription = (system: PlacementSystemConfiguration) => {
    const bracketCount = system.brackets.length;
    const totalPositions = system.brackets.reduce(
      (sum, bracket) => sum + bracket.positions.length,
      0
    );

    return `${bracketCount} bracket${bracketCount > 1 ? 's' : ''}, ${totalPositions} team positions`;
  };

  return (
    <div className="space-y-6">
      {/* Type Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Filter by Type</Label>
        <RadioGroup
          value={selectedType}
          onValueChange={(value) =>
            setSelectedType(value as PlacementSystemType | 'all')
          }
          className="flex flex-wrap gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="all" id="all" />
            <Label htmlFor="all" className="text-sm">
              All Types
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="simple-placement" id="simple" />
            <Label htmlFor="simple" className="text-sm">
              Simple Placement
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="tiered-brackets" id="tiered" />
            <Label htmlFor="tiered" className="text-sm">
              Tiered Brackets
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="cross-group" id="cross" />
            <Label htmlFor="cross" className="text-sm">
              Cross-Group
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="swiss-style" id="swiss" />
            <Label htmlFor="swiss" className="text-sm">
              Swiss-Style
            </Label>
          </div>
        </RadioGroup>
      </div>

      <Separator />

      {/* System Selection */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Select Placement System</Label>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((system) => (
            <Card
              key={system.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedSystemId === system.id
                  ? 'bg-primary/5 ring-2 ring-primary'
                  : 'hover:bg-muted/50'
              } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
              onClick={() => !disabled && onSystemSelect(system.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getSystemIcon(system.type)}
                    <CardTitle className="text-sm">{system.name}</CardTitle>
                  </div>
                  {selectedSystemId === system.id && (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  )}
                </div>
                <CardDescription className="text-xs">
                  {system.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Brackets</span>
                    <span>{system.brackets.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Team Positions</span>
                    <span>
                      {system.brackets.reduce(
                        (sum, b) => sum + b.positions.length,
                        0
                      )}
                    </span>
                  </div>

                  {/* Bracket Preview */}
                  <div className="space-y-1">
                    {system.brackets.slice(0, 2).map((bracket) => (
                      <div
                        key={bracket.id}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="truncate">{bracket.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {bracket.positions.join(', ')}
                        </Badge>
                      </div>
                    ))}
                    {system.brackets.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{system.brackets.length - 2} more bracket
                        {system.brackets.length - 2 > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>

                  {/* Cross-group indicator */}
                  {system.crossGroupMatching?.enabled && (
                    <div className="flex items-center space-x-1 text-xs text-blue-600">
                      <Users className="h-3 w-3" />
                      <span>Cross-Group</span>
                    </div>
                  )}

                  {/* Details Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-full text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDetails(
                        showDetails === system.id ? null : system.id
                      );
                    }}
                  >
                    <Info className="mr-1 h-3 w-3" />
                    {showDetails === system.id ? 'Hide' : 'Show'} Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Detailed View */}
      {showDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              {filteredTemplates.find((s) => s.id === showDetails)?.name} -
              Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredTemplates
                .find((s) => s.id === showDetails)
                ?.brackets.map((bracket) => (
                  <div key={bracket.id} className="rounded-lg border p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="text-sm font-medium">{bracket.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {bracket.matchFormat}
                      </Badge>
                    </div>
                    <p className="mb-2 text-xs text-muted-foreground">
                      {bracket.description}
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span>Positions:</span>
                        <span>{bracket.positions.join(', ')}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span>Format:</span>
                        <span className="capitalize">
                          {bracket.matchFormat}
                        </span>
                      </div>
                      {bracket.includeThirdPlace && (
                        <div className="text-xs text-green-600">
                          ✓ Third Place Match
                        </div>
                      )}
                      {bracket.includeFifthPlace && (
                        <div className="text-xs text-green-600">
                          ✓ Fifth Place Match
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

