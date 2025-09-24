'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
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
import { ArrowLeft, Save, Shield } from 'lucide-react';
import { MainNavigation } from '@/components/navigation/main-navigation';

export default function EditTeamPage() {
  const router = useRouter();
  const params = useParams();
  const t = useTranslations();
  const { data: session, status } = useSession();
  const user = session?.user;
  const authLoading = status === 'loading';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    founded: '',
    coach: '',
    manager: '',
    email: '',
    phone: '',
    website: '',
    colors: '',
    status: 'active',
    description: '',
  });

  // Check if user is admin
  useEffect(() => {
    if (authLoading) return;

    if (!user || user.role !== 'ADMIN') {
      router.push('/auth/signin');
    }
  }, [user, authLoading, router]);

  // Load team data
  useEffect(() => {
    if (params.id) {
      // Mock data - in a real app, this would fetch from the API
      const mockTeam = {
        id: params.id as string,
        name: 'Helsinki United',
        city: 'Helsinki',
        founded: '1995',
        coach: 'Mika Kivinen',
        manager: 'Antti Virtanen',
        email: 'info@helsinkiunited.fi',
        phone: '+358 40 123 4567',
        website: 'https://helsinkiunited.fi',
        colors: 'Blue & White',
        status: 'active' as const,
        description:
          'Helsinki United is one of the most successful youth football clubs in Finland.',
      };

      setFormData({
        name: mockTeam.name,
        city: mockTeam.city,
        founded: mockTeam.founded,
        coach: mockTeam.coach,
        manager: mockTeam.manager,
        email: mockTeam.email,
        phone: mockTeam.phone,
        website: mockTeam.website,
        colors: mockTeam.colors,
        status: mockTeam.status,
        description: mockTeam.description,
      });
    }
  }, [params.id]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // In a real app, this would submit to the API
      console.log('Updating team:', formData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Redirect to teams list
      router.push('/admin/teams');
    } catch (error) {
      console.error('Error updating team:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading while checking session
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <MainNavigation />
        <main className="container mx-auto py-6">
          <div className="text-center">{t('common.loading')}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNavigation />

      <main className="container mx-auto py-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Back Button */}
          <Button variant="ghost" asChild>
            <Link href="/admin/teams">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.back')} {t('team.teams')}
            </Link>
          </Button>

          {/* Header */}
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">
              {t('team.edit')} {t('team.title')}
            </h1>
          </div>

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>{t('team.teamInformation')}</CardTitle>
              <CardDescription>{t('team.updateTeamDetails')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('team.teamName')}</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">{t('team.city')}</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="founded">{t('team.foundedYear')}</Label>
                    <Input
                      id="founded"
                      name="founded"
                      type="number"
                      value={formData.founded}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">{t('team.status')}</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        handleSelectChange('status', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">
                          {t('team.active')}
                        </SelectItem>
                        <SelectItem value="inactive">
                          {t('team.inactive')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="coach">{t('team.coach')}</Label>
                    <Input
                      id="coach"
                      name="coach"
                      value={formData.coach}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="manager">{t('team.manager')}</Label>
                    <Input
                      id="manager"
                      name="manager"
                      value={formData.manager}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">{t('team.email')}</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('team.phone')}</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">{t('team.website')}</Label>
                    <Input
                      id="website"
                      name="website"
                      type="url"
                      value={formData.website}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="colors">{t('team.colors')}</Label>
                    <Input
                      id="colors"
                      name="colors"
                      value={formData.colors}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t('team.description')}</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" asChild>
                    <Link href="/admin/teams">{t('common.cancel')}</Link>
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSubmitting
                      ? t('common.saving')
                      : t('common.saveChanges')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
