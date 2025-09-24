'use client';
import { Link } from '@/i18n/routing';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MainNavigation } from '@/components/navigation/main-navigation';
import {
  MapPin,
  Calendar,
  Users,
  Phone,
  Mail,
  Globe,
  Clock,
  Edit,
  Plus,
  ArrowLeft,
  Car,
  Utensils,
  Star,
  Camera,
} from 'lucide-react';

// Mock data - in a real app, this would fetch from the API
async function getVenue(id: string) {
  const venues = [
    {
      id: '1',
      name: 'Olympic Stadium',
      city: 'Helsinki',
      address: 'Paavo Nurmen tie 1, 00250 Helsinki',
      capacity: 40000,
      surface: 'Natural grass',
      type: 'stadium',
      status: 'active',
      facilities: [
        'Parking',
        'Food & Beverage',
        'VIP Areas',
        'Media Center',
        'Press Box',
        'VIP Suites',
      ],
      tournaments: ['Youth Championship 2024'],
      upcomingMatches: [
        {
          id: '1',
          homeTeam: 'Helsinki United',
          awayTeam: 'Espoo Eagles',
          tournament: 'Youth Championship 2024',
          date: '2024-06-20',
          time: '19:00',
          status: 'scheduled',
        },
        {
          id: '2',
          homeTeam: 'Oulu Owls',
          awayTeam: 'Local Heroes',
          tournament: 'Youth Championship 2024',
          date: '2024-06-25',
          time: '18:00',
          status: 'scheduled',
        },
        {
          id: '3',
          homeTeam: 'Visiting Stars',
          awayTeam: 'Helsinki United',
          tournament: 'Summer Cup 2024',
          date: '2024-06-30',
          time: '20:00',
          status: 'scheduled',
        },
      ],
      recentMatches: [
        {
          id: '1',
          homeTeam: 'Helsinki United',
          awayTeam: 'Espoo Eagles',
          score: '3-1',
          date: '2024-06-10',
          attendance: 1250,
        },
        {
          id: '2',
          homeTeam: 'Local Heroes',
          awayTeam: 'Visiting Stars',
          score: '2-1',
          date: '2024-06-08',
          attendance: 980,
        },
      ],
      coordinates: { lat: 60.1875, lng: 24.9294 },
      phone: '+358 9 234 5678',
      email: 'info@olympicstadium.fi',
      website: 'https://olympicstadium.fi',
      description:
        "The iconic Olympic Stadium in Helsinki is one of Finland's most historic sports venues. Built for the 1952 Summer Olympics, it has hosted countless memorable sporting events and continues to be a premier destination for football matches and other athletic competitions.",
      openingHours: 'Monday-Sunday: 6:00 AM - 11:00 PM',
      parkingInfo: 'Free parking available for 500 vehicles',
      accessibility: [
        'Wheelchair accessible',
        'Elevator access',
        'Accessible seating',
        'Assistive listening devices',
      ],
      rules: [
        'No smoking',
        'No outside food or beverages',
        'No professional cameras without permission',
        'Follow security instructions',
      ],
    },
    {
      id: '2',
      name: 'Espoo Sports Center',
      city: 'Espoo',
      address: 'Urheilupuisto 1, 02100 Espoo',
      capacity: 8000,
      surface: 'Hybrid grass',
      type: 'sports_center',
      status: 'active',
      facilities: [
        'Parking',
        'Cafeteria',
        'Training Fields',
        'Gym',
        'Swimming Pool',
        'Tennis Courts',
      ],
      tournaments: ['Youth Championship 2024'],
      upcomingMatches: [
        {
          id: '1',
          homeTeam: 'Espoo Eagles',
          awayTeam: 'Oulu Owls',
          tournament: 'Youth Championship 2024',
          date: '2024-06-22',
          time: '17:00',
          status: 'scheduled',
        },
        {
          id: '2',
          homeTeam: 'Local Heroes',
          awayTeam: 'Helsinki United',
          tournament: 'Youth Championship 2024',
          date: '2024-06-28',
          time: '19:00',
          status: 'scheduled',
        },
      ],
      recentMatches: [
        {
          id: '1',
          homeTeam: 'Espoo Eagles',
          awayTeam: 'Helsinki United',
          score: '1-3',
          date: '2024-06-10',
          attendance: 650,
        },
      ],
      coordinates: { lat: 60.2055, lng: 24.6559 },
      phone: '+358 9 345 6789',
      email: 'info@espoosports.fi',
      website: 'https://espoosports.fi',
      description:
        'Espoo Sports Center is a modern multi-sport facility offering excellent training and competition venues for various sports. The center is known for its high-quality hybrid grass surface and comprehensive sports facilities.',
      openingHours:
        'Monday-Friday: 7:00 AM - 10:00 PM, Saturday-Sunday: 8:00 AM - 9:00 PM',
      parkingInfo: 'Free parking for 200 vehicles',
      accessibility: [
        'Wheelchair accessible',
        'Accessible seating',
        'Accessible restrooms',
      ],
      rules: ['No smoking', 'Respect other users', 'Follow facility rules'],
    },
    {
      id: '3',
      name: 'Oulu Sports Center',
      city: 'Oulu',
      address: 'Urheilukatu 1, 90100 Oulu',
      capacity: 12000,
      surface: 'Artificial turf',
      type: 'sports_center',
      status: 'active',
      facilities: [
        'Parking',
        'Restaurant',
        'Indoor Arena',
        'Swimming Pool',
        'Ice Rink',
        'Athletics Track',
      ],
      tournaments: ['Youth Championship 2024'],
      upcomingMatches: [
        {
          id: '1',
          homeTeam: 'Oulu Owls',
          awayTeam: 'Espoo Eagles',
          tournament: 'Youth Championship 2024',
          date: '2024-06-24',
          time: '18:00',
          status: 'scheduled',
        },
      ],
      recentMatches: [
        {
          id: '1',
          homeTeam: 'Oulu Owls',
          awayTeam: 'Helsinki United',
          score: '2-2',
          date: '2024-06-03',
          attendance: 850,
        },
      ],
      coordinates: { lat: 65.0121, lng: 25.4651 },
      phone: '+358 8 456 7890',
      email: 'info@oulusports.fi',
      website: 'https://oulusports.fi',
      description:
        'Oulu Sports Center is the premier sports facility in northern Finland, featuring state-of-the-art artificial turf and comprehensive indoor and outdoor sports facilities.',
      openingHours: 'Monday-Sunday: 6:00 AM - 11:00 PM',
      parkingInfo: 'Free parking for 300 vehicles',
      accessibility: [
        'Wheelchair accessible',
        'Accessible seating',
        'Accessible restrooms',
      ],
      rules: ['No smoking', 'Follow facility rules', 'Respect other users'],
    },
    {
      id: '4',
      name: 'Summer Arena',
      city: 'Vantaa',
      address: 'Kesäpuisto 1, 01300 Vantaa',
      capacity: 15000,
      surface: 'Natural grass',
      type: 'stadium',
      status: 'active',
      facilities: [
        'Parking',
        'Food Court',
        'Fan Zone',
        'Merchandise Shop',
        'VIP Areas',
        'Media Center',
      ],
      tournaments: ['Summer Cup 2024'],
      upcomingMatches: [
        {
          id: '1',
          homeTeam: 'Local Heroes',
          awayTeam: 'Visiting Stars',
          tournament: 'Summer Cup 2024',
          date: '2024-06-21',
          time: '19:00',
          status: 'scheduled',
        },
        {
          id: '2',
          homeTeam: 'Visiting Stars',
          awayTeam: 'Local Heroes',
          tournament: 'Summer Cup 2024',
          date: '2024-06-28',
          time: '20:00',
          status: 'scheduled',
        },
        {
          id: '3',
          homeTeam: 'Helsinki United',
          awayTeam: 'Oulu Owls',
          tournament: 'Summer Cup 2024',
          date: '2024-07-02',
          time: '18:00',
          status: 'scheduled',
        },
        {
          id: '4',
          homeTeam: 'Espoo Eagles',
          awayTeam: 'Tampere Titans',
          tournament: 'Summer Cup 2024',
          date: '2024-07-05',
          time: '19:00',
          status: 'scheduled',
        },
      ],
      recentMatches: [
        {
          id: '1',
          homeTeam: 'Local Heroes',
          awayTeam: 'Helsinki United',
          score: '0-4',
          date: '2024-05-27',
          attendance: 1200,
        },
        {
          id: '2',
          homeTeam: 'Visiting Stars',
          awayTeam: 'Local Heroes',
          score: '1-2',
          date: '2024-05-20',
          attendance: 1100,
        },
      ],
      coordinates: { lat: 60.2934, lng: 25.0378 },
      phone: '+358 9 567 8901',
      email: 'info@summerarena.fi',
      website: 'https://summerarena.fi',
      description:
        'Summer Arena is a modern outdoor stadium designed for summer sports and events. With its natural grass surface and excellent facilities, it provides an ideal setting for competitive football matches.',
      openingHours: 'Monday-Sunday: 7:00 AM - 10:00 PM',
      parkingInfo: 'Free parking for 400 vehicles',
      accessibility: [
        'Wheelchair accessible',
        'Accessible seating',
        'Accessible restrooms',
      ],
      rules: [
        'No smoking',
        'No outside food or beverages',
        'Follow security instructions',
      ],
    },
    {
      id: '5',
      name: 'Central Stadium',
      city: 'Tampere',
      address: 'Keskustadion 1, 33100 Tampere',
      capacity: 25000,
      surface: 'Hybrid grass',
      type: 'stadium',
      status: 'active',
      facilities: [
        'Parking',
        'Restaurant',
        'VIP Suites',
        'Press Box',
        'Media Center',
        'Fan Zone',
      ],
      tournaments: ['Spring League 2024'],
      upcomingMatches: [
        {
          id: '1',
          homeTeam: 'Tampere Titans',
          awayTeam: 'Vantaa Vipers',
          tournament: 'Spring League 2024',
          date: '2024-06-23',
          time: '19:00',
          status: 'scheduled',
        },
        {
          id: '2',
          homeTeam: 'Suburban Stars',
          awayTeam: 'Tampere Titans',
          tournament: 'Spring League 2024',
          date: '2024-06-29',
          time: '18:00',
          status: 'scheduled',
        },
      ],
      recentMatches: [
        {
          id: '1',
          homeTeam: 'Tampere Titans',
          awayTeam: 'Vantaa Vipers',
          score: '2-1',
          date: '2024-06-09',
          attendance: 1800,
        },
      ],
      coordinates: { lat: 61.4978, lng: 23.761 },
      phone: '+358 3 678 9012',
      email: 'info@centralstadium.fi',
      website: 'https://centralstadium.fi',
      description:
        'Central Stadium in Tampere is a historic venue that has been modernized to meet contemporary standards. It features excellent hybrid grass surface and comprehensive facilities for both players and spectators.',
      openingHours: 'Monday-Sunday: 6:00 AM - 11:00 PM',
      parkingInfo: 'Free parking for 350 vehicles',
      accessibility: [
        'Wheelchair accessible',
        'Accessible seating',
        'Accessible restrooms',
      ],
      rules: [
        'No smoking',
        'No outside food or beverages',
        'Follow security instructions',
      ],
    },
  ];

  return venues.find((venue) => venue.id === id);
}

function getVenueTypeLabel(type: string) {
  switch (type) {
    case 'stadium':
      return 'Stadium';
    case 'sports_center':
      return 'Sports Center';
    case 'training_ground':
      return 'Training Ground';
    case 'indoor_arena':
      return 'Indoor Arena';
    default:
      return type;
  }
}

function getFacilityIcon(facility: string) {
  if (facility.includes('Parking')) return <Car className="h-4 w-4" />;
  if (
    facility.includes('Food') ||
    facility.includes('Restaurant') ||
    facility.includes('Cafeteria')
  )
    return <Utensils className="h-4 w-4" />;
  if (facility.includes('VIP')) return <Star className="h-4 w-4" />;
  if (facility.includes('Media') || facility.includes('Press'))
    return <Camera className="h-4 w-4" />;
  return <Users className="h-4 w-4" />;
}

export default async function VenueDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const venue = await getVenue(params.id);

  if (!venue) {
    return (
      <div className="min-h-screen bg-background">
        <MainNavigation />
        <main className="container mx-auto py-6">
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="mb-2 text-lg font-semibold">Venue Not Found</h3>
              <p className="mb-4 text-muted-foreground">
                The venue you&apos;re looking for doesn&apos;t exist.
              </p>
              <Button asChild>
                <Link href="/venues">Back to Venues</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNavigation />

      <main className="container mx-auto py-6">
        <div className="space-y-6">
          {/* Back Button */}
          <Button variant="ghost" asChild>
            <Link href="/venues">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Venues
            </Link>
          </Button>

          {/* Venue Header */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight">
                  {venue.name}
                </h1>
                <div className="flex items-center space-x-4 text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>{venue.city}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>{venue.capacity.toLocaleString()} capacity</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>{getVenueTypeLabel(venue.type)}</span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button asChild variant="outline">
                  <Link href={`/admin/venues/${venue.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Venue
                  </Link>
                </Button>
                <Button asChild>
                  <Link href={`/admin/venues/${venue.id}/matches/new`}>
                    <Plus className="mr-2 h-4 w-4" />
                    Schedule Match
                  </Link>
                </Button>
              </div>
            </div>

            {/* Venue Description */}
            <p className="max-w-3xl text-lg text-muted-foreground">
              {venue.description}
            </p>
          </div>

          {/* Key Information Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Address</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm">{venue.address}</div>
                <p className="text-xs text-muted-foreground">Location</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Surface</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold">{venue.surface}</div>
                <p className="text-xs text-muted-foreground">Playing Surface</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Opening Hours
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm">{venue.openingHours}</div>
                <p className="text-xs text-muted-foreground">Daily Schedule</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Parking</CardTitle>
                <Car className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm">{venue.parkingInfo}</div>
                <p className="text-xs text-muted-foreground">
                  Vehicle Information
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Facilities */}
          <Card>
            <CardHeader>
              <CardTitle>Facilities & Amenities</CardTitle>
              <CardDescription>
                Available services and features at this venue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {venue.facilities.map((facility, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 rounded-lg border p-3"
                  >
                    {getFacilityIcon(facility)}
                    <span className="text-sm font-medium">{facility}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Matches */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Matches</CardTitle>
              <CardDescription>Matches scheduled at this venue</CardDescription>
            </CardHeader>
            <CardContent>
              {venue.upcomingMatches.length > 0 ? (
                <div className="space-y-3">
                  {venue.upcomingMatches.map((match) => (
                    <div
                      key={match.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-sm font-medium">
                            {match.date}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {match.time}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{match.homeTeam}</div>
                          <div className="text-sm text-muted-foreground">
                            vs
                          </div>
                          <div className="font-medium">{match.awayTeam}</div>
                        </div>
                        <Badge variant="outline">{match.tournament}</Badge>
                      </div>
                      <Button asChild size="sm">
                        <Link href={`/matches/${match.id}`}>View Match</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">
                    No Upcoming Matches
                  </h3>
                  <p className="mb-4 text-muted-foreground">
                    There are no matches currently scheduled at this venue.
                  </p>
                  <Button asChild>
                    <Link href={`/admin/venues/${venue.id}/matches/new`}>
                      Schedule a Match
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Matches */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Matches</CardTitle>
              <CardDescription>Latest results from this venue</CardDescription>
            </CardHeader>
            <CardContent>
              {venue.recentMatches.length > 0 ? (
                <div className="space-y-3">
                  {venue.recentMatches.map((match) => (
                    <div
                      key={match.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-sm font-medium">
                            {match.date}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Date
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{match.homeTeam}</div>
                          <div className="text-lg font-bold">{match.score}</div>
                          <div className="font-medium">{match.awayTeam}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium">
                            {match.attendance.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Attendance
                          </div>
                        </div>
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/matches/${match.id}`}>View Details</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">
                    No Recent Matches
                  </h3>
                  <p className="text-muted-foreground">
                    No matches have been played at this venue yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                Get in touch with venue management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{venue.phone}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{venue.email}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={venue.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {venue.website}
                    </a>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="text-sm">
                    <span className="font-medium">Opening Hours:</span>
                    <div className="text-muted-foreground">
                      {venue.openingHours}
                    </div>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Parking:</span>
                    <div className="text-muted-foreground">
                      {venue.parkingInfo}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Accessibility & Rules */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Accessibility</CardTitle>
                <CardDescription>
                  Features for visitors with special needs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {venue.accessibility.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Venue Rules</CardTitle>
                <CardDescription>
                  Important guidelines for visitors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {venue.rules.map((rule, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      <span className="text-sm">{rule}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
