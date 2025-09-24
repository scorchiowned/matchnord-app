'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Check, X, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

interface InlineEditFieldProps {
  label: string;
  value: string;
  onSave: (newValue: string) => Promise<void>;
  type?: 'text' | 'textarea' | 'email' | 'tel' | 'number' | 'url';
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  className?: string;
  min?: number;
  max?: number;
  step?: number;
}

export function InlineEditField({
  label,
  value,
  onSave,
  type = 'text',
  placeholder,
  required = false,
  multiline = false,
  className = '',
  min,
  max,
  step,
}: InlineEditFieldProps) {
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

    if (required && !editValue.trim()) {
      toast.error(`${label} is required`);
      return;
    }

    try {
      setIsSaving(true);
      await onSave(editValue.trim());
      setIsEditing(false);
      toast.success(`${label} updated successfully`);
    } catch (error) {
      console.error('Error saving field:', error);
      toast.error(`Failed to update ${label}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Label className="text-sm font-medium text-style-text-secondary">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </Label>
        <div className="flex items-center space-x-2">
          {multiline ? (
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="min-h-[80px]"
              autoFocus
            />
          ) : (
            <Input
              type={type}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              autoFocus
              className="flex-1"
              min={min}
              max={max}
              step={step}
            />
          )}
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
        {value || (
          <span className="italic text-style-text-secondary">Not set</span>
        )}
      </p>
    </div>
  );
}
