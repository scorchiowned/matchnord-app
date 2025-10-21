'use client';

import { Label } from '@/components/ui/label';

interface TeamLogoUploadProps {
  logo: string;
  onLogoChange: (logo: string) => void;
  error?: string;
}

export function TeamLogoUpload({
  logo,
  onLogoChange,
  error,
}: TeamLogoUploadProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Team Logo</Label>
        <p className="text-sm text-gray-600">
          Teams inherit their logo from their club. No separate team logo upload
          needed.
        </p>
      </div>

      <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Your team will use the logo of the club you
          select. If you're creating a new club, you can upload a club logo
          during the club creation process.
        </p>
      </div>
    </div>
  );
}
