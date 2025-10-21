import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { azureStorage } from '@/lib/azure-storage';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;
    const tournamentId = formData.get('tournamentId') as string;
    const teamId = formData.get('teamId') as string;
    const clubId = formData.get('clubId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB for images)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    try {
      let uploadResult;

      // Route uploads based on type and context
      if (type === 'tournament-logo' && tournamentId) {
        uploadResult = await azureStorage.uploadFile(file, {
          container: 'tournaments',
          folder: `${tournamentId}/logo`,
          generateUniqueName: true,
        });
      } else if (type === 'tournament-hero' && tournamentId) {
        uploadResult = await azureStorage.uploadFile(file, {
          container: 'tournaments',
          folder: `${tournamentId}/hero`,
          generateUniqueName: true,
        });
      } else if (type === 'team-logo' && teamId) {
        uploadResult = await azureStorage.uploadFile(file, {
          container: 'teams',
          folder: teamId,
          generateUniqueName: true,
        });
      } else if (type === 'club-logo' && clubId) {
        uploadResult = await azureStorage.uploadFile(file, {
          container: 'clubs',
          folder: clubId,
          generateUniqueName: true,
        });
      } else if (type === 'document' && tournamentId) {
        uploadResult = await azureStorage.uploadFile(file, {
          container: 'documents',
          folder: tournamentId,
          generateUniqueName: true,
        });
      } else {
        // Default upload to general uploads folder
        uploadResult = await azureStorage.uploadFile(file, {
          container: 'uploads',
          folder: 'general',
          generateUniqueName: true,
        });
      }

      return NextResponse.json({
        url: uploadResult.url,
        filename: uploadResult.filename,
        size: uploadResult.size,
        type: uploadResult.type,
        container: uploadResult.container,
      });
    } catch (error) {
      console.error('Error uploading file to Azure Blob Storage:', error);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
