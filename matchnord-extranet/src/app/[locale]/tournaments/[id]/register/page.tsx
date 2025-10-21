'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Link } from '@/i18n/routing';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { MainNavigation } from '@/components/navigation/main-navigation';
import { ClubSelection } from '@/components/registration/club-selection';
import { TeamLogoUpload } from '@/components/registration/team-logo-upload';
import {
  CheckCircle,
  XCircle,
  Users,
  Trophy,
  ArrowLeft,
  CreditCard,
} from 'lucide-react';

// Mock tournament data - in real app this would come from props or API
const mockTournament = {
  id: 'cmephv3nr0002j1mlkw3aho2f',
  name: 'Youth Championship 2024',
  startDate: '2024-06-01',
  endDate: '2024-08-31',
  divisions: [
    {
      id: 'cmephv3pi000aj1mlfwvi8tum',
      name: 'U18 Division',
      ageGroup: 'U18',
      format: '11v11',
      level: 'COMPETITIVE',
      currentTeams: 6,
      maxTeams: 16,
      fee: 150,
      available: true,
    },
  ],
};

interface RegistrationFormData {
  // Team Information
  teamName: string;
  club: string;
  clubId: string;
  clubSelectionType: 'existing' | 'new';
  city: string;
  country: string;
  level: string;

  // Division Selection
  divisionId: string;

  // Manager Information
  managerName: string;
  managerEmail: string;
  managerPhone: string;

  // Team Details
  playerCount: number;
  ageRange: string;
  specialNotes: string;

  // Payment Information
  paymentMethod: 'CARD' | 'BANK_TRANSFER' | 'INVOICE';

  // Terms and Conditions
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  marketingConsent: boolean;
}

const initialFormData: RegistrationFormData = {
  teamName: '',
  club: '',
  clubId: '',
  clubSelectionType: 'existing',
  city: '',
  country: 'Finland',
  level: '',
  divisionId: '',
  managerName: '',
  managerEmail: '',
  managerPhone: '',
  playerCount: 0,
  ageRange: '',
  specialNotes: '',
  paymentMethod: 'CARD',
  acceptTerms: false,
  acceptPrivacy: false,
  marketingConsent: false,
};

export default function TournamentRegistrationPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] =
    useState<RegistrationFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = [
    {
      id: 1,
      title: 'Division Selection',
      description: 'Choose your age group',
    },
    { id: 2, title: 'Team Information', description: 'Team and club details' },
    { id: 3, title: 'Manager Details', description: 'Contact information' },
    { id: 4, title: 'Payment', description: 'Registration fee payment' },
    { id: 5, title: 'Review', description: 'Confirm registration' },
  ];

  const selectedDivision = mockTournament.divisions.find(
    (d) => d.id === formData.divisionId
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const processedValue = type === 'number' ? parseInt(value) || 0 : value;
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSwitchChange = (name: string, value: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.divisionId) {
          newErrors.divisionId = 'Please select a division';
        }
        break;
      case 2:
        if (!formData.teamName.trim()) {
          newErrors.teamName = 'Team name is required';
        }
        if (!formData.club.trim()) {
          newErrors.club = 'Club name is required';
        }
        if (!formData.city.trim()) {
          newErrors.city = 'City is required';
        }
        if (!formData.country.trim()) {
          newErrors.country = 'Country is required';
        }
        if (formData.playerCount < 1) {
          newErrors.playerCount = 'Please enter number of players';
        }
        break;
      case 3:
        if (!formData.managerName.trim()) {
          newErrors.managerName = 'Manager name is required';
        }
        if (!formData.managerEmail.trim()) {
          newErrors.managerEmail = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.managerEmail)) {
          newErrors.managerEmail = 'Please enter a valid email';
        }
        if (!formData.managerPhone.trim()) {
          newErrors.managerPhone = 'Phone number is required';
        }
        break;
      case 4:
        if (!formData.paymentMethod) {
          newErrors.paymentMethod = 'Please select a payment method';
        }
        break;
      case 5:
        if (!formData.acceptTerms) {
          newErrors.acceptTerms = 'You must accept the terms and conditions';
        }
        if (!formData.acceptPrivacy) {
          newErrors.acceptPrivacy = 'You must accept the privacy policy';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Debug: Log the data being sent
      const requestData = {
        tournamentId: params.id,
        divisionId: formData.divisionId,
        teamName: formData.teamName,
        club: formData.club,
        city: formData.city,
        country: formData.country,
        level: formData.level,
        managerName: formData.managerName,
        managerEmail: formData.managerEmail,
        managerPhone: formData.managerPhone,
        playerCount: Math.max(1, formData.playerCount || 1),
        ageRange: formData.ageRange,
        specialNotes: formData.specialNotes,
        paymentMethod: formData.paymentMethod,
        acceptTerms: formData.acceptTerms,
        acceptPrivacy: formData.acceptPrivacy,
        marketingConsent: formData.marketingConsent,
      };

      console.log('Sending registration data:', requestData);

      // Submit to API
      const response = await fetch('/api/v1/registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit registration');
      }

      const result = await response.json();

      // Store registration data in session storage for confirmation page
      sessionStorage.setItem(
        'registrationData',
        JSON.stringify(result.registration)
      );

      // Redirect to confirmation page
      router.push(`/tournaments/${params.id}/register/confirmation`);
    } catch (error) {
      console.error('Error submitting registration:', error);
      alert(
        error instanceof Error ? error.message : 'Failed to submit registration'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Select Division</h3>
              <p className="text-sm text-muted-foreground">
                Choose the appropriate age group for your team
              </p>
            </div>

            <div className="grid gap-4">
              {mockTournament.divisions.map((division) => (
                <Card
                  key={division.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    formData.divisionId === division.id
                      ? 'ring-2 ring-primary'
                      : ''
                  }`}
                  onClick={() => handleSelectChange('divisionId', division.id)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          {division.name}
                        </CardTitle>
                        <CardDescription>
                          {division.ageGroup} • {division.format} •{' '}
                          {division.level}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          €{division.fee}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Registration fee
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-medium">
                          {division.currentTeams}
                        </div>
                        <div className="text-muted-foreground">Teams</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{division.maxTeams}</div>
                        <div className="text-muted-foreground">Max</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">
                          {Math.round(
                            (division.currentTeams / division.maxTeams) * 100
                          )}
                          %
                        </div>
                        <div className="text-muted-foreground">Full</div>
                      </div>
                    </div>

                    {division.currentTeams >= division.maxTeams && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
                        <XCircle className="h-4 w-4" />
                        Division is full
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {errors.divisionId && (
              <div className="text-sm text-red-600">{errors.divisionId}</div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Team Information</h3>
              <p className="text-sm text-muted-foreground">
                Provide details about your team
              </p>
            </div>

            <div className="grid gap-6">
              {/* Team Name */}
              <div className="space-y-2">
                <Label htmlFor="teamName">Team Name *</Label>
                <Input
                  id="teamName"
                  name="teamName"
                  value={formData.teamName}
                  onChange={handleInputChange}
                  placeholder="e.g., HJK U12 Boys"
                  className={errors.teamName ? 'border-red-500' : ''}
                />
                {errors.teamName && (
                  <div className="text-sm text-red-600">{errors.teamName}</div>
                )}
              </div>

              {/* Team Logo - Teams inherit from club */}
              <TeamLogoUpload logo="" onLogoChange={() => {}} error="" />

              {/* Club Selection */}
              <ClubSelection
                selectedClubId={formData.clubId}
                clubSelectionType={formData.clubSelectionType}
                onClubChange={(clubId) =>
                  setFormData((prev) => ({ ...prev, clubId }))
                }
                onClubTypeChange={(type) =>
                  setFormData((prev) => ({ ...prev, clubSelectionType: type }))
                }
                onNewClubDataChange={(data) => {
                  setFormData((prev) => ({
                    ...prev,
                    club: data.name,
                    clubId: '', // Clear selected club when adding new
                  }));
                }}
                newClubData={{
                  name: formData.club,
                  shortName: '',
                  city: formData.city,
                  logo: '',
                }}
                errors={errors}
              />

              {/* Team Level */}
              <div className="space-y-2">
                <Label htmlFor="level">Team Level</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) => handleSelectChange('level', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="elite">Elite</SelectItem>
                    <SelectItem value="competitive">Competitive</SelectItem>
                    <SelectItem value="recreational">Recreational</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="e.g., Helsinki"
                    className={errors.city ? 'border-red-500' : ''}
                  />
                  {errors.city && (
                    <div className="text-sm text-red-600">{errors.city}</div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) =>
                      handleSelectChange('country', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Finland">Finland</SelectItem>
                      <SelectItem value="Sweden">Sweden</SelectItem>
                      <SelectItem value="Norway">Norway</SelectItem>
                      <SelectItem value="Denmark">Denmark</SelectItem>
                      <SelectItem value="Estonia">Estonia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="playerCount">Number of Players *</Label>
                  <Input
                    id="playerCount"
                    name="playerCount"
                    type="number"
                    value={formData.playerCount}
                    onChange={handleInputChange}
                    placeholder="e.g., 15"
                    min="1"
                    max="25"
                    className={errors.playerCount ? 'border-red-500' : ''}
                  />
                  {errors.playerCount && (
                    <div className="text-sm text-red-600">
                      {errors.playerCount}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ageRange">Age Range</Label>
                  <Input
                    id="ageRange"
                    name="ageRange"
                    value={formData.ageRange}
                    onChange={handleInputChange}
                    placeholder="e.g., 11-12 years"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialNotes">Special Notes</Label>
                <Textarea
                  id="specialNotes"
                  name="specialNotes"
                  value={formData.specialNotes}
                  onChange={handleInputChange}
                  placeholder="Any special requirements or notes..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Manager Information</h3>
              <p className="text-sm text-muted-foreground">
                Contact details for the team manager
              </p>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="managerName">Manager Name *</Label>
                <Input
                  id="managerName"
                  name="managerName"
                  value={formData.managerName}
                  onChange={handleInputChange}
                  placeholder="e.g., John Smith"
                  className={errors.managerName ? 'border-red-500' : ''}
                />
                {errors.managerName && (
                  <div className="text-sm text-red-600">
                    {errors.managerName}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="managerEmail">Email Address *</Label>
                <Input
                  id="managerEmail"
                  name="managerEmail"
                  type="email"
                  value={formData.managerEmail}
                  onChange={handleInputChange}
                  placeholder="manager@example.com"
                  className={errors.managerEmail ? 'border-red-500' : ''}
                />
                {errors.managerEmail && (
                  <div className="text-sm text-red-600">
                    {errors.managerEmail}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="managerPhone">Phone Number *</Label>
                <Input
                  id="managerPhone"
                  name="managerPhone"
                  value={formData.managerPhone}
                  onChange={handleInputChange}
                  placeholder="+358 40 123 4567"
                  className={errors.managerPhone ? 'border-red-500' : ''}
                />
                {errors.managerPhone && (
                  <div className="text-sm text-red-600">
                    {errors.managerPhone}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Payment Information</h3>
              <p className="text-sm text-muted-foreground">
                Select your preferred payment method
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Payment Method *</Label>
                <div className="grid gap-3">
                  <div
                    className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-all hover:bg-muted ${
                      formData.paymentMethod === 'CARD'
                        ? 'ring-2 ring-primary'
                        : ''
                    }`}
                    onClick={() => handleSelectChange('paymentMethod', 'CARD')}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5" />
                      <div>
                        <div className="font-medium">Credit Card</div>
                        <div className="text-sm text-muted-foreground">
                          Pay securely online
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-medium">
                      €{selectedDivision?.fee}
                    </div>
                  </div>

                  <div
                    className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-all hover:bg-muted ${
                      formData.paymentMethod === 'BANK_TRANSFER'
                        ? 'ring-2 ring-primary'
                        : ''
                    }`}
                    onClick={() =>
                      handleSelectChange('paymentMethod', 'BANK_TRANSFER')
                    }
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5" />
                      <div>
                        <div className="font-medium">Bank Transfer</div>
                        <div className="text-sm text-muted-foreground">
                          Pay via bank transfer
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-medium">
                      €{selectedDivision?.fee}
                    </div>
                  </div>

                  <div
                    className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-all hover:bg-muted ${
                      formData.paymentMethod === 'INVOICE'
                        ? 'ring-2 ring-primary'
                        : ''
                    }`}
                    onClick={() =>
                      handleSelectChange('paymentMethod', 'INVOICE')
                    }
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5" />
                      <div>
                        <div className="font-medium">Invoice</div>
                        <div className="text-sm text-muted-foreground">
                          Receive an invoice
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-medium">
                      €{selectedDivision?.fee}
                    </div>
                  </div>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Payment Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Registration Fee</span>
                    <span>€{selectedDivision?.fee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT (24%)</span>
                    <span>
                      €
                      {selectedDivision
                        ? Math.round(selectedDivision.fee * 0.24)
                        : 0}
                    </span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between font-medium">
                      <span>Total</span>
                      <span>
                        €
                        {selectedDivision
                          ? Math.round(selectedDivision.fee * 1.24)
                          : 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Review Registration</h3>
              <p className="text-sm text-muted-foreground">
                Please review your registration details before submitting
              </p>
            </div>

            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Team Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Team Name:</span>
                      <div>{formData.teamName}</div>
                    </div>
                    <div>
                      <span className="font-medium">Club:</span>
                      <div>{formData.club}</div>
                    </div>
                    <div>
                      <span className="font-medium">City:</span>
                      <div>{formData.city}</div>
                    </div>
                    <div>
                      <span className="font-medium">Country:</span>
                      <div>{formData.country}</div>
                    </div>
                    <div>
                      <span className="font-medium">Division:</span>
                      <div>{selectedDivision?.name}</div>
                    </div>
                    <div>
                      <span className="font-medium">Players:</span>
                      <div>{formData.playerCount}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Manager Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Name:</span>
                      <div>{formData.managerName}</div>
                    </div>
                    <div>
                      <span className="font-medium">Email:</span>
                      <div>{formData.managerEmail}</div>
                    </div>
                    <div>
                      <span className="font-medium">Phone:</span>
                      <div>{formData.managerPhone}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Registration Fee</span>
                    <span>€{selectedDivision?.fee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT (24%)</span>
                    <span>
                      €
                      {selectedDivision
                        ? Math.round(selectedDivision.fee * 0.24)
                        : 0}
                    </span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between font-medium">
                      <span>Total</span>
                      <span>
                        €
                        {selectedDivision
                          ? Math.round(selectedDivision.fee * 1.24)
                          : 0}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Payment method: {formData.paymentMethod}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <div className="flex items-start space-x-2">
                  <Switch
                    id="acceptTerms"
                    checked={formData.acceptTerms}
                    onCheckedChange={(checked) =>
                      handleSwitchChange('acceptTerms', checked)
                    }
                  />
                  <div className="space-y-1">
                    <Label htmlFor="acceptTerms" className="text-sm">
                      I accept the{' '}
                      <Link
                        href="/terms"
                        className="text-primary hover:underline"
                      >
                        Terms and Conditions
                      </Link>
                    </Label>
                    {errors.acceptTerms && (
                      <div className="text-sm text-red-600">
                        {errors.acceptTerms}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Switch
                    id="acceptPrivacy"
                    checked={formData.acceptPrivacy}
                    onCheckedChange={(checked) =>
                      handleSwitchChange('acceptPrivacy', checked)
                    }
                  />
                  <div className="space-y-1">
                    <Label htmlFor="acceptPrivacy" className="text-sm">
                      I accept the{' '}
                      <Link
                        href="/privacy"
                        className="text-primary hover:underline"
                      >
                        Privacy Policy
                      </Link>
                    </Label>
                    {errors.acceptPrivacy && (
                      <div className="text-sm text-red-600">
                        {errors.acceptPrivacy}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Switch
                    id="marketingConsent"
                    checked={formData.marketingConsent}
                    onCheckedChange={(checked) =>
                      handleSwitchChange('marketingConsent', checked)
                    }
                  />
                  <div className="space-y-1">
                    <Label htmlFor="marketingConsent" className="text-sm">
                      I agree to receive tournament updates and news (optional)
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <MainNavigation />

      <main className="container mx-auto py-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Page Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/tournaments/${params.id}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Tournament
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Register Team
              </h1>
              <p className="text-muted-foreground">
                Register your team for {mockTournament.name}
              </p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                      currentStep >= step.id
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground bg-muted text-muted-foreground'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-medium">{step.id}</span>
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <div className="text-xs font-medium">{step.title}</div>
                    <div className="hidden text-xs text-muted-foreground sm:block">
                      {step.description}
                    </div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`mx-2 h-0.5 w-16 ${
                      currentStep > step.id ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Step {currentStep}: {steps[currentStep - 1]?.title || 'Unknown'}
              </CardTitle>
              <CardDescription>
                {steps[currentStep - 1]?.description ||
                  'No description available'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {renderStepContent()}

                {/* Navigation */}
                <div className="flex justify-between pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>

                  <div className="flex gap-2">
                    {currentStep === steps.length ? (
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Submit Registration
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button type="button" onClick={nextStep}>
                        Next
                      </Button>
                    )}

                    <Button type="button" variant="outline" asChild>
                      <Link href={`/tournaments/${params.id}`}>Cancel</Link>
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
