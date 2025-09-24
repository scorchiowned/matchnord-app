'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Check, X, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

interface SelectOption {
  value: string;
  label: string;
}

interface InlineEditSelectProps {
  label: string;
  value: string;
  options: SelectOption[];
  onSave: (newValue: string) => Promise<void>;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function InlineEditSelect({
  label,
  value,
  options,
  onSave,
  placeholder = 'Select an option',
  required = false,
  className = '',
}: InlineEditSelectProps) {
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

    if (required && !editValue) {
      toast.error(`${label} is required`);
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

  const selectedOption = options.find((option) => option.value === value);

  if (isEditing) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Label className="text-sm font-medium text-style-text-secondary">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </Label>
        <div className="flex items-center space-x-2">
          <Select value={editValue} onValueChange={setEditValue}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent className="border bg-white shadow-lg">
              {options.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="bg-white hover:bg-gray-50"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
    );
  }

  return (
    <div
      className={`${className?.includes('space-y-0') ? 'space-y-0' : 'space-y-1'} ${className}`}
    >
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-style-text-secondary">
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
      <p className="-mx-2 -my-1 rounded px-2 py-1 text-sm transition-colors group-hover:bg-style-card-bg/50">
        {selectedOption?.label || (
          <span className="italic text-style-text-secondary">Not set</span>
        )}
      </p>
    </div>
  );
}
