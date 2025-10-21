# Public Site Registration Implementation Guide

This guide explains how to implement the enhanced registration system with club selection and team logo upload functionality on the public site.

## Overview

The registration system now includes:

- **Team Logo Upload**: Teams can upload their own logos during registration
- **Club Selection**: Choose from existing clubs or add new ones
- **Enhanced Team Information**: Better organization of team data

## API Endpoints

### Club Management Endpoints

#### Get Clubs

```http
GET /api/v1/clubs
```

**Query Parameters:**

- `search` (optional): Search by club name, short name, or city
- `countryId` (optional): Filter by country
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:**

```json
{
  "clubs": [
    {
      "id": "club-123",
      "name": "Helsinki Football Club",
      "shortName": "HFC",
      "logo": "https://example.com/logo.png",
      "city": "Helsinki",
      "country": {
        "id": "finland",
        "name": "Finland",
        "code": "FI"
      },
      "_count": {
        "teams": 5
      }
    }
  ],
  "total": 25,
  "limit": 50,
  "offset": 0
}
```

#### Get Specific Club

```http
GET /api/v1/clubs/{id}
```

**Response:**

```json
{
  "id": "club-123",
  "name": "Helsinki Football Club",
  "shortName": "HFC",
  "logo": "https://example.com/logo.png",
  "city": "Helsinki",
  "country": {
    "id": "finland",
    "name": "Finland",
    "code": "FI"
  },
  "website": "https://hfc.fi",
  "description": "Founded in 1907",
  "foundedYear": 1907,
  "teams": [
    {
      "id": "team-456",
      "name": "HFC U12 Boys",
      "tournament": {
        "id": "tournament-789",
        "name": "Youth Championship 2024"
      }
    }
  ],
  "_count": {
    "teams": 5
  }
}
```

### Registration Endpoint

#### Submit Registration

```http
POST /api/v1/registrations
```

**Request Body:**

```json
{
  "tournamentId": "tournament-123",
  "divisionId": "division-456",
  "teamName": "HFC U12 Boys",
  "club": "Helsinki Football Club",
  "clubId": "club-123",
  "clubLogo": "https://storage.azure.com/clubs/temp/logo-def456.jpg",
  "clubSelectionType": "existing",
  "city": "Helsinki",
  "country": "Finland",
  "level": "competitive",
  "contactFirstName": "John",
  "contactLastName": "Doe",
  "contactEmail": "john.doe@example.com",
  "contactPhone": "+358401234567",
  "contactAddress": "Mannerheimintie 1",
  "contactPostalCode": "00100",
  "contactCity": "Helsinki",
  "billingName": "Helsinki FC",
  "billingAddress": "Mannerheimintie 1",
  "billingPostalCode": "00100",
  "billingCity": "Helsinki",
  "billingEmail": "billing@hfc.fi",
  "acceptTerms": true,
  "acceptPrivacy": true,
  "marketingConsent": false
}
```

**Response:**

```json
{
  "success": true,
  "team": {
    "id": "team-789",
    "name": "HFC U12 Boys",
    "logo": "https://storage.example.com/team-logos/team-789.jpg",
    "club": "Helsinki Football Club",
    "clubId": "club-123",
    "status": "PENDING",
    "isWaitlisted": false
  },
  "message": "Registration submitted successfully"
}
```

## File Upload Flow

### **Important: Logo Upload Process**

The system uses a **two-step process** for logo uploads to ensure security and proper file handling:

#### **Step 1: Upload Club Logo to Azure Storage**

```typescript
// Upload club logo (teams inherit from their club)
const uploadFormData = new FormData();
uploadFormData.append('file', file);
uploadFormData.append('type', 'club-logo');
uploadFormData.append('clubId', 'temp');

const response = await fetch('/api/upload', {
  method: 'POST',
  body: uploadFormData,
});

const uploadResult = await response.json();
// uploadResult.url = "https://storage.azure.com/clubs/temp/logo-abc123.jpg"
```

#### **Step 2: Send Azure Storage URL to Registration**

```typescript
// Registration data with Azure Storage URLs
const registrationData = {
  teamName: 'HFC U12 Boys',
  club: 'Helsinki Football Club',
  clubLogo: 'https://storage.azure.com/clubs/temp/logo-abc123.jpg', // Azure URL
  // ... other fields
};
```

### **Why This Approach?**

1. **Security**: Files are uploaded through a dedicated upload endpoint with proper validation
2. **Performance**: Azure Storage URLs are much smaller than base64 strings
3. **Scalability**: Files are stored in Azure Blob Storage, not the database
4. **CDN Ready**: URLs can be easily cached and served via CDN
5. **Logical Design**: Teams inherit logos from their clubs, which reflects real-world football structure

## Frontend Implementation

### 1. Club Selection Component

Create a component for club selection with search functionality:

```typescript
// components/ClubSelector.tsx
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Building2 } from 'lucide-react';
import Image from 'next/image';

interface Club {
  id: string;
  name: string;
  shortName?: string;
  logo?: string;
  city?: string;
  country: {
    id: string;
    name: string;
    code: string;
  };
}

interface ClubSelectorProps {
  selectedClubId: string;
  onClubChange: (clubId: string) => void;
  onNewClub: () => void;
}

export function ClubSelector({ selectedClubId, onClubChange, onNewClub }: ClubSelectorProps) {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const searchClubs = async (term: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (term) params.append('search', term);
      params.append('limit', '20');

      const response = await fetch(`/api/v1/clubs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setClubs(data.clubs || []);
      }
    } catch (error) {
      console.error('Error searching clubs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchClubs(searchTerm);
  }, [searchTerm]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="Search for club name, city, or abbreviation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={onNewClub}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Club
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-4">Searching clubs...</div>
      ) : (
        <div className="grid gap-3 max-h-60 overflow-y-auto">
          {clubs.map((club) => (
            <Card
              key={club.id}
              className={`cursor-pointer transition-colors ${
                selectedClubId === club.id
                  ? 'ring-2 ring-blue-500 bg-blue-50'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => onClubChange(club.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {club.logo ? (
                    <Image
                      src={club.logo}
                      alt={`${club.name} logo`}
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-gray-500" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{club.name}</div>
                    <div className="text-sm text-gray-600">
                      {club.city && `${club.city}, `}
                      {club.country.name}
                    </div>
                    {club.shortName && (
                      <Badge variant="secondary" className="text-xs">
                        {club.shortName}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {clubs.length === 0 && !loading && (
            <div className="text-center py-4 text-gray-500">
              No clubs found. Try a different search term or add a new club.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

### 2. Team Logo Upload Component

Create a component for team logo upload:

```typescript
// components/TeamLogoUpload.tsx
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface TeamLogoUploadProps {
  logo: string;
  onLogoChange: (logo: string) => void;
  error?: string;
}

export function TeamLogoUpload({ logo, onLogoChange, error }: TeamLogoUploadProps) {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>(logo);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
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
    setLogoPreview('');
    onLogoChange('');
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Team Logo</Label>
        <p className="text-sm text-gray-600">
          Upload a logo for your team. This will be displayed in tournament listings and results.
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
          <Input
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
            {logoPreview ? 'Change Logo' : 'Upload Logo'}
          </Label>
          <p className="text-xs text-gray-500">
            Max 5MB • JPG, PNG, GIF
          </p>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}
    </div>
  );
}
```

### 3. Registration Form Integration

Update your registration form to include the new components:

```typescript
// pages/register.tsx
import { useState } from 'react';
import { ClubSelector } from '@/components/ClubSelector';
import { TeamLogoUpload } from '@/components/TeamLogoUpload';

interface RegistrationFormData {
  teamName: string;
  teamLogo: string;
  club: string;
  clubId: string;
  clubSelectionType: 'existing' | 'new';
  city: string;
  country: string;
  level: string;
  // ... other fields
}

export default function RegistrationPage() {
  const [formData, setFormData] = useState<RegistrationFormData>({
    teamName: '',
    teamLogo: '',
    club: '',
    clubId: '',
    clubSelectionType: 'existing',
    city: '',
    country: 'Finland',
    level: '',
    // ... other fields
  });

  const [showNewClubForm, setShowNewClubForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/v1/registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        // Handle successful registration
        console.log('Registration successful:', result);
      } else {
        const error = await response.json();
        console.error('Registration failed:', error);
      }
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Team Name */}
      <div>
        <label htmlFor="teamName" className="block text-sm font-medium mb-2">
          Team Name *
        </label>
        <input
          id="teamName"
          type="text"
          value={formData.teamName}
          onChange={(e) => setFormData(prev => ({ ...prev, teamName: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          required
        />
      </div>

      {/* Team Logo Upload */}
      <TeamLogoUpload
        logo={formData.teamLogo}
        onLogoChange={(logo) => setFormData(prev => ({ ...prev, teamLogo: logo }))}
      />

      {/* Club Selection */}
      {!showNewClubForm ? (
        <div>
          <label className="block text-sm font-medium mb-2">
            Select Club
          </label>
          <ClubSelector
            selectedClubId={formData.clubId}
            onClubChange={(clubId) => setFormData(prev => ({ ...prev, clubId }))}
            onNewClub={() => setShowNewClubForm(true)}
          />
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium mb-2">
            Add New Club
          </label>
          <div className="space-y-4">
            <div>
              <label htmlFor="newClubName" className="block text-sm font-medium mb-1">
                Club Name *
              </label>
              <input
                id="newClubName"
                type="text"
                value={formData.club}
                onChange={(e) => setFormData(prev => ({ ...prev, club: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label htmlFor="newClubCity" className="block text-sm font-medium mb-1">
                City
              </label>
              <input
                id="newClubCity"
                type="text"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowNewClubForm(false)}
            >
              Back to Club Selection
            </Button>
          </div>
        </div>
      )}

      {/* Other form fields... */}

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
      >
        Submit Registration
      </button>
    </form>
  );
}
```

## Implementation Steps

### 1. Database Setup

Ensure your database has the latest migrations:

```bash
npx prisma migrate deploy
```

### 2. API Integration

- Test the club endpoints: `GET /api/v1/clubs`
- Test the registration endpoint: `POST /api/v1/registrations`
- Ensure proper error handling for all API calls

### 3. Frontend Components

- Implement the `ClubSelector` component
- Implement the `TeamLogoUpload` component
- Update your registration form to use these components

### 4. Form Validation

Add client-side validation for:

- Required fields (team name, club selection)
- File upload validation (file type, size)
- Email format validation
- Terms acceptance

### 5. Error Handling

Implement proper error handling for:

- API failures
- File upload errors
- Network issues
- Validation errors

## Best Practices

### 1. Performance

- Implement debounced search for club selection
- Optimize image uploads (compress before upload)
- Use lazy loading for club lists

### 2. User Experience

- Show loading states during API calls
- Provide clear feedback for form validation
- Use progressive disclosure for complex forms

### 3. Security

- Validate file uploads on both client and server
- Sanitize user input
- Implement rate limiting for API calls

### 4. Accessibility

- Use proper ARIA labels
- Ensure keyboard navigation works
- Provide alternative text for images

## Testing

### 1. Unit Tests

Test individual components:

```typescript
// ClubSelector.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ClubSelector } from '@/components/ClubSelector';

test('renders club selector', () => {
  render(<ClubSelector selectedClubId="" onClubChange={() => {}} onNewClub={() => {}} />);
  expect(screen.getByPlaceholderText(/search for club/i)).toBeInTheDocument();
});
```

### 2. Integration Tests

Test the complete registration flow:

```typescript
// Registration.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RegistrationPage from '@/pages/register';

test('submits registration with club and logo', async () => {
  // Mock API calls
  global.fetch = jest.fn()
    .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ clubs: [] }) })
    .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true }) });

  render(<RegistrationPage />);

  // Fill form
  fireEvent.change(screen.getByLabelText(/team name/i), { target: { value: 'Test Team' } });
  fireEvent.change(screen.getByLabelText(/club name/i), { target: { value: 'Test Club' } });

  // Submit
  fireEvent.click(screen.getByText(/submit registration/i));

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith('/api/v1/registrations', expect.any(Object));
  });
});
```

### 3. E2E Tests

Test the complete user journey:

```typescript
// registration.e2e.test.ts
import { test, expect } from '@playwright/test';

test('complete registration flow', async ({ page }) => {
  await page.goto('/register');

  // Fill team information
  await page.fill('[data-testid="team-name"]', 'Test Team');

  // Upload logo
  await page.setInputFiles('[data-testid="logo-upload"]', 'test-logo.jpg');

  // Select club
  await page.click('[data-testid="club-selector"]');
  await page.fill('[data-testid="club-search"]', 'Test Club');
  await page.click('[data-testid="club-option"]');

  // Submit
  await page.click('[data-testid="submit-button"]');

  // Verify success
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
});
```

## Troubleshooting

### Common Issues

1. **Club search not working**
   - Check API endpoint is accessible
   - Verify search parameters are correct
   - Check network requests in browser dev tools

2. **Logo upload failing**
   - Verify file size limits (5MB max)
   - Check file type restrictions (images only)
   - Ensure proper base64 encoding

3. **Registration submission errors**
   - Check all required fields are filled
   - Verify API endpoint URL
   - Check request body format

### Debug Tips

1. **Enable logging**

   ```typescript
   console.log('Form data:', formData);
   console.log('API response:', response);
   ```

2. **Check network requests**
   - Open browser dev tools
   - Go to Network tab
   - Monitor API calls during registration

3. **Validate data format**
   - Ensure all required fields are present
   - Check data types match API expectations
   - Verify file uploads are properly encoded

## Support

For technical support or questions about implementation:

- Check the API documentation
- Review error messages in browser console
- Test API endpoints directly with tools like Postman
- Contact the development team for assistance
