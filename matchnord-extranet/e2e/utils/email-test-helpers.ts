import { db } from '@/lib/db';
import { randomBytes } from 'crypto';

export interface TestUser {
  id: string;
  email: string;
  name: string;
  role: string;
  emailVerified: Date | null;
  isActive: boolean;
  approvedAt?: Date | null;
  approvedBy?: string | null;
}

export interface TestInvitation {
  id: string;
  email: string;
  role: string;
  token: string;
  status: string;
  inviterId: string;
}

export async function setupTestUser(userData: {
  email: string;
  name: string;
  role: string;
  emailVerified?: Date | null;
  isActive?: boolean;
  approvedAt?: Date | null;
  approvedBy?: string | null;
}): Promise<TestUser> {
  // First try to find existing user
  let user = await db.user.findUnique({
    where: { email: userData.email },
  });

  if (!user) {
    // Create new user if doesn't exist
    user = await db.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        role: userData.role as any,
        emailVerified: userData.emailVerified || null,
        isActive: userData.isActive ?? false,
        approvedAt: userData.approvedAt || null,
        approvedBy: userData.approvedBy || null,
      },
    });
  } else {
    // Update existing user
    user = await db.user.update({
      where: { email: userData.email },
      data: {
        name: userData.name,
        role: userData.role as any,
        emailVerified: userData.emailVerified || null,
        isActive: userData.isActive ?? false,
        approvedAt: userData.approvedAt || null,
        approvedBy: userData.approvedBy || null,
      },
    });
  }

  return {
    id: user.id,
    email: user.email!,
    name: user.name!,
    role: user.role,
    emailVerified: user.emailVerified,
    isActive: user.isActive,
    approvedAt: user.approvedAt,
    approvedBy: user.approvedBy,
  };
}

export async function setupTestInvitation(invitationData: {
  email: string;
  role: string;
  inviterId: string;
  tournamentId?: string;
  teamId?: string;
}): Promise<TestInvitation> {
  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invitation = await db.userInvitation.create({
    data: {
      email: invitationData.email,
      role: invitationData.role as any,
      inviterId: invitationData.inviterId,
      tournamentId: invitationData.tournamentId || null,
      teamId: invitationData.teamId || null,
      token,
      expires,
      status: 'PENDING',
    },
  });

  return {
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    token: invitation.token,
    status: invitation.status,
    inviterId: invitation.inviterId,
  };
}

export async function createVerificationToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

  await db.emailVerificationToken.create({
    data: {
      userId,
      token,
      expires,
      used: false,
    },
  });

  return token;
}

export async function createExpiredToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

  await db.emailVerificationToken.create({
    data: {
      userId,
      token,
      expires,
      used: false,
    },
  });

  return token;
}

export async function cleanupTestData(): Promise<void> {
  // Clean up test users
  await db.user.deleteMany({
    where: {
      email: {
        in: [
          'testuser@example.com',
          'verifytest@example.com',
          'expiredtest@example.com',
          'resendtest@example.com',
          'teammanager@example.com',
          'pendingmanager@example.com',
          'inviter@example.com',
          'invited@example.com',
          'accepttest@example.com',
        ],
      },
    },
  });

  // Clean up verification tokens
  await db.emailVerificationToken.deleteMany({
    where: {
      user: {
        email: {
          in: [
            'testuser@example.com',
            'verifytest@example.com',
            'expiredtest@example.com',
            'resendtest@example.com',
            'teammanager@example.com',
            'pendingmanager@example.com',
            'inviter@example.com',
            'invited@example.com',
            'accepttest@example.com',
          ],
        },
      },
    },
  });

  // Clean up invitations
  await db.userInvitation.deleteMany({
    where: {
      email: {
        in: ['invited@example.com', 'accepttest@example.com'],
      },
    },
  });

  // Clean up registrations
  await db.registration.deleteMany({
    where: {
      manager: {
        email: {
          in: ['teammanager@example.com'],
        },
      },
    },
  });
}

export async function getTestUser(email: string): Promise<TestUser | null> {
  const user = await db.user.findUnique({
    where: { email },
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email!,
    name: user.name!,
    role: user.role,
    emailVerified: user.emailVerified,
    isActive: user.isActive,
    approvedAt: user.approvedAt,
    approvedBy: user.approvedBy,
  };
}

export async function getTestInvitations(
  email: string
): Promise<TestInvitation[]> {
  const invitations = await db.userInvitation.findMany({
    where: { email },
  });

  return invitations.map((invitation) => ({
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    token: invitation.token,
    status: invitation.status,
    inviterId: invitation.inviterId,
  }));
}

export async function getTestRegistrations(
  managerEmail: string
): Promise<any[]> {
  const registrations = await db.registration.findMany({
    where: {
      manager: {
        email: managerEmail,
      },
    },
    include: {
      tournament: true,
      division: true,
    },
  });

  return registrations;
}
