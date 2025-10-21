"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

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
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>(logo);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setLogoPreview(result);
        onLogoChange(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview("");
    onLogoChange("");
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Team Logo</Label>
        <p className="text-sm text-gray-600">
          Upload a logo for your team. This will be displayed in tournament
          listings and results.
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Logo Preview */}
        <div className="flex items-center gap-3">
          {logoPreview ? (
            <div className="relative">
              <Image
                src={logoPreview}
                alt="Team logo preview"
                width={80}
                height={80}
                className="rounded-full object-cover border-2 border-gray-200"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                onClick={handleRemoveLogo}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300">
              <ImageIcon className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Upload Button */}
        <div className="flex flex-col gap-2">
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
            id="team-logo-upload"
          />
          <Label
            htmlFor="team-logo-upload"
            className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <Upload className="h-4 w-4" />
            {logoPreview ? "Change Logo" : "Upload Logo"}
          </Label>
          <p className="text-xs text-gray-500">Max 5MB • JPG, PNG, GIF</p>
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}
    </div>
  );
}
