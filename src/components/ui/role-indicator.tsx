'use client';

import { useSession } from 'next-auth/react';
import { Badge } from '@/components/ui/badge';
import { RoleDisplay } from '@/lib/permissions';
import { UserRole } from '@prisma/client';
import { Shield, Users, Trophy, UserCheck } from 'lucide-react';

interface RoleIndicatorProps {
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const roleIcons = {
  ADMIN: Shield,
  TEAM_MANAGER: Users,
  TOURNAMENT_ADMIN: Trophy,
  REFEREE: UserCheck,
};

export function RoleIndicator({
  className = '',
  showIcon = true,
  size = 'md',
}: RoleIndicatorProps) {
  const { data: session } = useSession();
  const user = session?.user;

  if (!user?.role) {
    return null;
  }

  const role = user.role as UserRole;
  const roleName = RoleDisplay.getRoleName(role);
  const roleColor = RoleDisplay.getRoleColor(role);
  const IconComponent = roleIcons[role];

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <Badge
      variant="outline"
      className={`${roleColor} ${sizeClasses[size]} ${className}`}
    >
      {showIcon && IconComponent && (
        <IconComponent className={`${iconSizes[size]} mr-1.5`} />
      )}
      <span className="font-medium">{roleName}</span>
    </Badge>
  );
}

// Compact version for navigation bars
export function RoleIndicatorCompact({
  className = '',
}: {
  className?: string;
}) {
  return <RoleIndicator className={className} size="sm" showIcon={true} />;
}

// Full version for dashboards
export function RoleIndicatorFull({ className = '' }: { className?: string }) {
  return <RoleIndicator className={className} size="lg" showIcon={true} />;
}
