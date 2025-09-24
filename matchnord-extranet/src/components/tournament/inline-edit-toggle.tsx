'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Check, X, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

interface InlineEditToggleProps {
  label: string;
  value: boolean;
  onSave: (newValue: boolean) => Promise<void>;
  className?: string;
}

export function InlineEditToggle({
  label,
  value,
  onSave,
  className = '',
}: InlineEditToggleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);

  const handleStartEdit = () => {
    setEditValue(value);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    try {
      setIsSaving(true);
      await onSave(editValue);
      setIsEditing(false);
      toast.success(`${label} updated successfully`);
    } catch (error) {
      console.error('Error saving field:', error);
      toast.error(`Failed to update ${label}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Label className="text-sm font-medium text-muted-foreground">
          {label}
        </Label>
        <div className="flex items-center space-x-3">
          <Switch
            checked={editValue}
            onCheckedChange={setEditValue}
            disabled={isSaving}
            autoFocus
          />
          <span className="text-sm text-muted-foreground">
            {editValue ? 'Enabled' : 'Disabled'}
          </span>
          <div className="flex items-center space-x-1">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-8 w-8 p-0"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group ${className?.includes('space-y-0') ? 'space-y-0' : 'space-y-1'} ${className}`}
    >
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-muted-foreground">
          {label}
        </Label>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleStartEdit}
          className="h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <Edit2 className="h-3 w-3" />
        </Button>
      </div>
      <div className="flex items-center space-x-2">
        <Switch checked={value} disabled className="pointer-events-none" />
        <span className="text-sm text-muted-foreground">
          {value ? 'Enabled' : 'Disabled'}
        </span>
      </div>
    </div>
  );
}
