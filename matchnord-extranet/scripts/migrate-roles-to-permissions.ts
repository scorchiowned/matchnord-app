/**
 * Migration script to convert role-based system to permission-based system
 * 
 * This script:
 * 1. Converts all non-ADMIN users to USER role
 * 2. Migrates TournamentAssignment roles to permission booleans
 * 3. Updates UserInvitation records
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting role to permissions migration...');

  // Step 1: Convert all non-ADMIN users to USER role
  console.log('\n1. Converting user roles...');
  const usersUpdated = await prisma.user.updateMany({
    where: {
      role: {
        not: 'ADMIN',
      },
    },
    data: {
      role: 'USER',
    },
  });
  console.log(`   Updated ${usersUpdated.count} users to USER role`);

  // Step 2: Migrate TournamentAssignment roles to permissions
  console.log('\n2. Migrating TournamentAssignment roles to permissions...');
  
  // Get all tournament assignments
  const assignments = await prisma.tournamentAssignment.findMany({
    where: {
      role: {
        not: undefined, // Get all assignments that have a role
      },
    },
  });

  console.log(`   Found ${assignments.length} tournament assignments to migrate`);

  let migratedCount = 0;
  for (const assignment of assignments) {
    const role = assignment.role as string;
    let canConfigure = false;
    let canManageScores = false;
    let isReferee = false;

    // Map old roles to new permissions
    switch (role) {
      case 'MANAGER':
        canConfigure = true;
        break;
      case 'ADMIN':
        canConfigure = true;
        canManageScores = true;
        break;
      case 'REFEREE':
        isReferee = true;
        break;
      case 'VIEWER':
        // VIEWER has no permissions - we'll keep the assignment but with all false
        break;
      default:
        console.log(`   Warning: Unknown role "${role}" for assignment ${assignment.id}`);
    }

    // Update the assignment
    await prisma.tournamentAssignment.update({
      where: { id: assignment.id },
      data: {
        canConfigure,
        canManageScores,
        isReferee,
        // Keep the old role in permissions JSON for reference during transition
        permissions: {
          ...(assignment.permissions as object || {}),
          migratedFromRole: role,
        },
      },
    });

    migratedCount++;
  }

  console.log(`   Migrated ${migratedCount} tournament assignments`);

  // Step 3: Ensure tournament owners have proper permissions
  console.log('\n3. Ensuring tournament owners have proper permissions...');
  const tournaments = await prisma.tournament.findMany({
    select: {
      id: true,
      createdById: true,
    },
  });

  let ownerAssignmentsCreated = 0;
  for (const tournament of tournaments) {
    // Check if owner already has an assignment
    const existingAssignment = await prisma.tournamentAssignment.findUnique({
      where: {
        userId_tournamentId: {
          userId: tournament.createdById,
          tournamentId: tournament.id,
        },
      },
    });

    if (!existingAssignment) {
      // Create assignment for owner with full permissions
      await prisma.tournamentAssignment.create({
        data: {
          userId: tournament.createdById,
          tournamentId: tournament.id,
          canConfigure: true,
          canManageScores: true,
          isReferee: false, // Owners don't need referee flag by default
          assignedBy: tournament.createdById,
          isActive: true,
        },
      });
      ownerAssignmentsCreated++;
    } else {
      // Update existing assignment to ensure owner has full permissions
      await prisma.tournamentAssignment.update({
        where: { id: existingAssignment.id },
        data: {
          canConfigure: true,
          canManageScores: true,
        },
      });
    }
  }

  console.log(`   Created/updated ${ownerAssignmentsCreated} owner assignments`);

  // Step 4: Update UserInvitation records (set default permissions)
  console.log('\n4. Updating UserInvitation records...');
  const invitationsUpdated = await prisma.userInvitation.updateMany({
    data: {
      canConfigure: false,
      canManageScores: false,
      isReferee: false,
    },
  });
  console.log(`   Updated ${invitationsUpdated.count} invitations with default permissions`);

  console.log('\n✅ Migration completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Run Prisma migration to update schema');
  console.log('2. Update application code to use new permission system');
  console.log('3. Test thoroughly before deploying to production');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

