'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X, Edit2, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface InlineEditImageProps {
  label: string;
  value?: string;
  onSave: (newValue: string) => Promise<void>;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'auto';
  uploadType?: 'tournament-logo' | 'tournament-hero' | 'team-logo' | 'document';
  tournamentId?: string;
  teamId?: string;
}

export function InlineEditImage({
  label,
  value,
  onSave,
  className = '',
  aspectRatio = 'auto',
  uploadType = 'document',
  tournamentId,
  teamId,
}: InlineEditImageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    try {
      setIsUploading(true);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', uploadType);
      
      if (tournamentId) {
        formData.append('tournamentId', tournamentId);
      }
      if (teamId) {
        formData.append('teamId', teamId);
      }

      // Upload file (you'll need to implement this endpoint)
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        await onSave(data.url);
        setIsEditing(false);
        toast.success(`${label} updated successfully`);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(`Failed to update ${label}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      await onSave('');
      toast.success(`${label} removed successfully`);
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error(`Failed to remove ${label}`);
    }
  };

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'square':
        return 'aspect-square';
      case 'video':
        return 'aspect-video';
      default:
        return 'aspect-auto';
    }
  };

  if (isEditing) {
    return (
      <div
        className={`${className?.includes('space-y-0') ? 'space-y-0' : 'space-y-2'} ${className}`}
      >
        <Label className="text-sm font-medium text-muted-foreground">
          {label}
        </Label>
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex-1"
            >
              <Upload className="mr-2 h-4 w-4" />
              {isUploading ? 'Uploading...' : 'Select Image'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={isUploading}
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
      className={`group ${className?.includes('space-y-0') ? 'space-y-0' : 'space-y-2'} ${className}`}
    >
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-muted-foreground">
          {label}
        </Label>
        <div className="flex items-center space-x-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleStartEdit}
            className="h-6 w-6 p-0"
          >
            <Edit2 className="h-3 w-3" />
          </Button>
          {value && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRemove}
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      <div
        className={`rounded border p-2 transition-colors group-hover:bg-muted/50 ${getAspectRatioClass()}`}
      >
        {value ? (
          <img
            src={value}
            alt={label}
            className="h-full w-full rounded object-cover"
          />
        ) : (
          <div 
            className="flex h-24 flex-col items-center justify-center text-muted-foreground cursor-pointer hover:bg-muted/30 transition-colors rounded"
            onClick={handleStartEdit}
          >
            <ImageIcon className="mb-2 h-8 w-8" />
            <span className="text-sm">Click to upload image</span>
          </div>
        )}
      </div>
    </div>
  );
}
