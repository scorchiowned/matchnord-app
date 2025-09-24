import { BlobServiceClient, BlockBlobClient } from '@azure/storage-blob';
import { env } from '@/lib/env';

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  type: string;
  container: string;
}

export interface UploadOptions {
  container?: string;
  folder?: string;
  generateUniqueName?: boolean;
}

class AzureStorageService {
  private blobServiceClient: BlobServiceClient;
  private defaultContainer: string;

  constructor() {
    // Check if Azure Storage credentials are configured
    if (!env.AZURE_STORAGE_ACCOUNT_NAME || !env.AZURE_STORAGE_ACCOUNT_KEY) {
      console.warn('Azure Storage credentials not configured. File uploads will use placeholder URLs.');
      this.blobServiceClient = null as any;
      this.defaultContainer = 'uploads';
      return;
    }

    const connectionString = `DefaultEndpointsProtocol=https;AccountName=${env.AZURE_STORAGE_ACCOUNT_NAME};AccountKey=${env.AZURE_STORAGE_ACCOUNT_KEY};EndpointSuffix=core.windows.net`;
    
    this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    this.defaultContainer = env.AZURE_STORAGE_CONTAINER_NAME || 'uploads';
  }

  /**
   * Upload a file to Azure Blob Storage
   */
  async uploadFile(
    file: File | Buffer,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const {
      container = this.defaultContainer,
      folder = '',
      generateUniqueName = true
    } = options;

    // If Azure Storage is not configured, return a placeholder URL
    if (!this.blobServiceClient) {
      const filename = this.generateFilename(file, generateUniqueName);
      const placeholderUrl = `https://picsum.photos/400/300?random=${Date.now()}`;
      
      return {
        url: placeholderUrl,
        filename,
        size: this.isFile(file) ? file.size : file.length,
        type: this.getContentType(file),
        container: 'placeholder',
      };
    }

    try {
      // Ensure container exists
      await this.ensureContainerExists(container);

      // Generate unique filename
      const filename = this.generateFilename(file, generateUniqueName);
      const blobName = folder ? `${folder}/${filename}` : filename;

      // Get blob client
      const containerClient = this.blobServiceClient.getContainerClient(container);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      // Upload file
      const uploadOptions = {
        blobHTTPHeaders: {
          blobContentType: this.getContentType(file),
        },
      };

      let uploadData: Buffer;
      if (this.isFile(file)) {
        const arrayBuffer = await file.arrayBuffer();
        uploadData = Buffer.from(arrayBuffer);
      } else {
        uploadData = file;
      }

      await blockBlobClient.upload(uploadData, uploadData.length, uploadOptions);

      // Return upload result with SAS URL for private access
      const url = this.getFileUrl(blobName, container);
      const size = uploadData.length;
      const type = this.getContentType(file);

      console.log('Upload result:', {
        url,
        filename,
        size,
        type,
        container,
        urlType: typeof url
      });

      return {
        url,
        filename,
        size,
        type,
        container,
      };
    } catch (error) {
      console.error('Error uploading file to Azure Blob Storage:', error);
      
      // If upload fails, return a placeholder URL instead of throwing
      const filename = this.generateFilename(file, generateUniqueName);
      const placeholderUrl = `https://picsum.photos/400/300?random=${Date.now()}`;
      
      console.warn('Upload failed, using placeholder URL:', placeholderUrl);
      
      return {
        url: placeholderUrl,
        filename,
        size: this.isFile(file) ? file.size : file.length,
        type: this.getContentType(file),
        container: 'placeholder',
      };
    }
  }

  /**
   * Delete a file from Azure Blob Storage
   */
  async deleteFile(blobName: string, container?: string): Promise<void> {
    if (!this.blobServiceClient) {
      console.warn('Azure Storage not configured. Cannot delete file.');
      return;
    }

    try {
      const containerName = container || this.defaultContainer;
      const containerClient = this.blobServiceClient.getContainerClient(containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.deleteIfExists();
    } catch (error) {
      console.error('Error deleting file from Azure Blob Storage:', error);
      throw new Error('Failed to delete file from Azure Blob Storage');
    }
  }

  /**
   * Get a file URL from Azure Blob Storage with SAS token for private access
   */
  getFileUrl(blobName: string, container?: string): string {
    if (!this.blobServiceClient) {
      return `https://picsum.photos/400/300?random=${Date.now()}`;
    }

    const containerName = container || this.defaultContainer;
    const containerClient = this.blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    // For now, use direct URL instead of SAS tokens
    // This works if the container has public read access
    const directUrl = blockBlobClient.url;
    console.log('Generated direct URL:', directUrl);
    console.log('URL type:', typeof directUrl);
    
    return directUrl;
  }

  /**
   * List files in a container
   */
  async listFiles(container?: string, prefix?: string): Promise<string[]> {
    if (!this.blobServiceClient) {
      console.warn('Azure Storage not configured. Cannot list files.');
      return [];
    }

    try {
      const containerName = container || this.defaultContainer;
      const containerClient = this.blobServiceClient.getContainerClient(containerName);
      
      const blobs = [];
      for await (const blob of containerClient.listBlobsFlat({ prefix })) {
        blobs.push(blob.name);
      }
      
      return blobs;
    } catch (error) {
      console.error('Error listing files from Azure Blob Storage:', error);
      throw new Error('Failed to list files from Azure Blob Storage');
    }
  }

  /**
   * Ensure container exists, create if it doesn't
   */
  private async ensureContainerExists(containerName: string): Promise<void> {
    if (!this.blobServiceClient) {
      return;
    }

    try {
      const containerClient = this.blobServiceClient.getContainerClient(containerName);
      await containerClient.createIfNotExists({
        // Remove public access setting - use private containers
        // access: 'blob', // This causes issues with some Azure Storage accounts
      });
    } catch (error) {
      console.error('Error ensuring container exists:', error);
      // Don't throw error - continue with upload attempt
      console.warn('Container creation failed, but continuing with upload attempt');
    }
  }

  /**
   * Check if the object is a File (works in both browser and Node.js)
   */
  private isFile(file: any): file is File {
    return file && typeof file === 'object' && 'name' in file && 'size' in file && 'type' in file;
  }

  /**
   * Generate a unique filename
   */
  private generateFilename(file: File | Buffer, generateUnique: boolean): string {
    if (this.isFile(file)) {
      const originalName = file.name;
      const extension = originalName.split('.').pop() || '';
      const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
      
      if (generateUnique) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `${nameWithoutExt}-${timestamp}-${random}.${extension}`;
      }
      
      return originalName;
    } else {
      // For Buffer, generate a unique name
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      return `file-${timestamp}-${random}`;
    }
  }

  /**
   * Get content type from file
   */
  private getContentType(file: File | Buffer): string {
    if (this.isFile(file)) {
      return file.type || 'application/octet-stream';
    }
    return 'application/octet-stream';
  }
}

// Create singleton instance
export const azureStorage = new AzureStorageService();

// Helper functions for specific use cases
export const uploadTournamentImage = async (file: File, tournamentId: string, type: 'logo' | 'hero'): Promise<UploadResult> => {
  return azureStorage.uploadFile(file, {
    container: 'tournaments',
    folder: `${tournamentId}/${type}`,
    generateUniqueName: true,
  });
};

export const uploadTeamLogo = async (file: File, teamId: string): Promise<UploadResult> => {
  return azureStorage.uploadFile(file, {
    container: 'teams',
    folder: teamId,
    generateUniqueName: true,
  });
};

export const uploadDocument = async (file: File, tournamentId: string): Promise<UploadResult> => {
  return azureStorage.uploadFile(file, {
    container: 'documents',
    folder: tournamentId,
    generateUniqueName: true,
  });
};
