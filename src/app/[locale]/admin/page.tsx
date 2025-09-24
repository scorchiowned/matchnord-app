'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdminNavigation } from '@/components/navigation/admin-navigation';
import { useSession } from 'next-auth/react';
import {
  Trophy,
  Users,
  MapPin,
  Calendar,
  Clock,
  Award,
  BarChart3,
  Settings,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function AdminDashboard() {
  const { data: session } = useSession();
  const t = useTranslations();

  const user = session?.user;

  const stats = [
    {
      title: 'Total Tournaments',
      value: '12',
      icon: Trophy,
      change: '+2 from last month',
      changeType: 'positive' as const,
    },
    {
      title: 'Active Teams',
      value: '156',
      icon: Users,
      change: '+12 from last week',
      changeType: 'positive' as const,
    },
    {
      title: 'Venues',
      value: '8',
      icon: MapPin,
      change: 'No change',
      changeType: 'neutral' as const,
    },
    {
      title: 'Matches Today',
      value: '24',
      icon: Calendar,
      change: '+4 from yesterday',
      changeType: 'positive' as const,
    },
  ] as const;

  const recentActivities = [
    {
      id: 1,
      action: 'New tournament created',
      target: 'Summer Championship 2024',
      time: '2 hours ago',
      user: 'John Doe',
    },
    {
      id: 2,
      action: 'Team registered',
      target: 'FC Barcelona',
      time: '4 hours ago',
      user: 'Jane Smith',
    },
    {
      id: 3,
      action: 'Match result updated',
      target: 'Real Madrid vs Barcelona',
      time: '6 hours ago',
      user: 'Mike Johnson',
    },
    {
      id: 4,
      action: 'Venue added',
      target: 'Stadium Central',
      time: '1 day ago',
      user: 'Sarah Wilson',
    },
  ];

  const quickActions = [
    {
      title: 'Create Tournament',
      description: 'Set up a new tournament',
      href: '/admin/tournaments/new',
      icon: Trophy,
      color: 'bg-blue-500',
    },
    {
      title: 'Manage Teams',
      description: 'View and manage all teams',
      href: '/admin/teams',
      icon: Users,
      color: 'bg-green-500',
    },
    {
      title: 'Venue Management',
      description: 'Add and manage venues',
      href: '/admin/venues',
      icon: MapPin,
      color: 'bg-purple-500',
    },
    {
      title: 'System Settings',
      description: 'Configure system settings',
      href: '/admin/system',
      icon: Settings,
      color: 'bg-gray-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('admin.dashboard')}
              </h1>
              <p className="mt-2 text-gray-600">
                {t('admin.welcomeMessage', { name: user?.name || 'Admin' })}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <BarChart3 className="mr-2 h-4 w-4" />
                {t('admin.analytics')}
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                {t('admin.settings')}
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                    <p
                      className={`text-sm ${
                        stat.changeType === 'positive'
                          ? 'text-green-600'
                          : 'text-gray-600'
                      }`}
                    >
                      {stat.change}
                    </p>
                  </div>
                  <div className="rounded-full bg-blue-50 p-3">
                    <stat.icon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  {t('admin.recentActivity')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center space-x-4 rounded-lg p-3 hover:bg-gray-50"
                    >
                      <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.action}
                        </p>
                        <p className="text-sm text-gray-600">
                          {activity.target} • {activity.user}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500">{activity.time}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="mr-2 h-5 w-5" />
                  {t('admin.quickActions')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quickActions.map((action) => (
                    <Link key={action.title} href={action.href}>
                      <div className="flex cursor-pointer items-center space-x-3 rounded-lg p-3 hover:bg-gray-50">
                        <div className={`rounded-full p-2 ${action.color}`}>
                          <action.icon className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {action.title}
                          </p>
                          <p className="text-xs text-gray-600">
                            {action.description}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
