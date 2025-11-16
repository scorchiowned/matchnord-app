'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Division {
  id: string;
  name: string;
  level?: string;
}

interface DivisionFilterProps {
  divisions: Division[];
  selectedDivision: string;
  onDivisionChange: (divisionId: string) => void;
  showAllOption?: boolean;
  className?: string;
}

export function DivisionFilter({
  divisions,
  selectedDivision,
  onDivisionChange,
  showAllOption = true,
  className = '',
}: DivisionFilterProps) {
  if (divisions.length === 0) {
    return null;
  }

  return (
    <Tabs value={selectedDivision} onValueChange={onDivisionChange}>
      <TabsList
        className={`grid w-full grid-cols-1 gap-2 border-0 bg-transparent p-0 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${className}`}
      >
        {showAllOption && (
          <TabsTrigger value="all" className="border">
            All Divisions
          </TabsTrigger>
        )}
        {divisions.map((division) => (
          <TabsTrigger key={division.id} value={division.id} className="border">
            {division.name}
            {division.level ? ` | ${division.level}` : ''}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

