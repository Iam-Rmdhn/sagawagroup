// import { google } from 'googleapis';
// import fs from 'fs';
// import path from 'path';
// import { ENV } from '../env';

// export interface DriveFile {
//   id: string;
//   name: string;
//   mimeType: string;
//   thumbnailLink?: string;
//   webContentLink?: string;
//   webViewLink?: string;
//   createdTime: string;
//   modifiedTime: string;
//   size?: string;
// }

// interface CachedImage {
//   buffer: Buffer;
//   mimeType: string;
//   cachedAt: number;
// }

// class GoogleDriveService {
//   private drive: any;
//   private folderId: string;
//   private initialized: boolean = false;
//   private imageCache: Map<string, CachedImage> = new Map();
//   private readonly CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour
//   private readonly MAX_CACHE_ITEMS = 150;

//   constructor() {
//     this.folderId = ENV.GOOGLE_DRIVE_FOLDER_ID;
//     if (ENV.GOOGLE_DRIVE_ENABLED) {
//       this.initializeDrive();
//     }
//   }

//   private getCachedImage(fileId: string): CachedImage | null {
//     const cached = this.imageCache.get(fileId);
//     if (!cached) {
//       return null;
//     }

//     if (Date.now() - cached.cachedAt > this.CACHE_TTL_MS) {
//       this.imageCache.delete(fileId);
//       return null;
//     }

//     return cached;
//   }

//   private storeImageInCache(fileId: string, buffer: Buffer, mimeType: string) {
//     this.imageCache.set(fileId, {
//       buffer,
//       mimeType,
//       cachedAt: Date.now(),
//     });

//     if (this.imageCache.size <= this.MAX_CACHE_ITEMS) {
//       return;
//     }

//     const oldestEntry = this.imageCache.keys().next().value;
//     if (oldestEntry) {
//       this.imageCache.delete(oldestEntry);
//     }
//   }

//   private initializeDrive() {
//     try {
//       const keyPath = path.resolve(ENV.GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY_PATH);
//       const keyFile = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

//       const auth = new google.auth.GoogleAuth({
//         credentials: {
//           client_email: keyFile.client_email,
//           private_key: keyFile.private_key.replace(/\\n/g, '\n'),
//         },
//         scopes: ['https://www.googleapis.com/auth/drive.readonly'],
//       });

//       this.drive = google.drive({ version: 'v3', auth });
//       this.initialized = true;
//       console.log('Google Drive service initialized successfully');
//     } catch (error) {
//       console.error('Failed to initialize Google Drive service:', error);
//       this.initialized = false;
//     }
//   }

//   async getGalleryImages(): Promise<DriveFile[]> {
//     if (!ENV.GOOGLE_DRIVE_ENABLED) {
//       console.log('Google Drive integration is disabled');
//       return [];
//     }

//     if (!this.initialized) {
//       throw new Error('Google Drive service not initialized');
//     }

//     try {
//       const response = await this.drive.files.list({
//         q: `'${this.folderId}' in parents and (mimeType contains 'image/') and trashed = false`,
//         orderBy: 'modifiedTime desc',
//         fields: 'files(id,name,mimeType,thumbnailLink,webContentLink,webViewLink,createdTime,modifiedTime,size)',
//         pageSize: 100,
//       });

//       return response.data.files.map((file: any) => ({
//         id: file.id,
//         name: file.name,
//         mimeType: file.mimeType,
//         thumbnailLink: file.thumbnailLink,
//         webContentLink: file.webContentLink,
//         webViewLink: file.webViewLink,
//         createdTime: file.createdTime,
//         modifiedTime: file.modifiedTime,
//         size: file.size,
//       }));
//     } catch (error) {
//       console.error('Error fetching gallery images from Drive:', error);
//       throw new Error('Failed to fetch gallery images from Google Drive');
//     }
//   }

//   async getImageBuffer(fileId: string): Promise<{ buffer: Buffer; mimeType: string; fromCache: boolean; }> {
//     if (!ENV.GOOGLE_DRIVE_ENABLED) {
//       throw new Error('Google Drive integration is disabled');
//     }

//     if (!this.initialized) {
//       throw new Error('Google Drive service not initialized');
//     }

//     const cached = this.getCachedImage(fileId);
//     if (cached) {
//       return {
//         buffer: cached.buffer,
//         mimeType: cached.mimeType,
//         fromCache: true,
//       };
//     }

//     try {
//       const response = await this.drive.files.get(
//         {
//           fileId,
//           alt: 'media',
//         },
//         {
//           responseType: 'arraybuffer',
//         }
//       );

//       const mimeType = response.headers['content-type'] || 'image/jpeg';
//       const buffer = Buffer.from(response.data as ArrayBuffer);
//       this.storeImageInCache(fileId, buffer, mimeType);

//       return {
//         buffer,
//         mimeType,
//         fromCache: false,
//       };
//     } catch (error) {
//       console.error('Error downloading image from Drive:', error);
//       throw new Error('Failed to download image from Google Drive');
//     }
//   }

//   async getImageUrl(fileId: string): Promise<string> {
//     if (!ENV.GOOGLE_DRIVE_ENABLED || !this.initialized) {
//       throw new Error('Google Drive service not available');
//     }

//     try {
//       const response = await this.drive.files.get({
//         fileId: fileId,
//         fields: 'webContentLink',
//       });
//       return response.data.webContentLink;
//     } catch (error) {
//       console.error('Error getting image URL:', error);
//       throw new Error('Failed to get image URL from Google Drive');
//     }
//   }

//   async getImageMetadata(fileId: string): Promise<DriveFile | null> {
//     if (!ENV.GOOGLE_DRIVE_ENABLED || !this.initialized) {
//       return null;
//     }

//     try {
//       const response = await this.drive.files.get({
//         fileId: fileId,
//         fields: 'id,name,mimeType,thumbnailLink,webContentLink,webViewLink,createdTime,modifiedTime,size',
//       });

//       const file = response.data;
//       return {
//         id: file.id,
//         name: file.name,
//         mimeType: file.mimeType,
//         thumbnailLink: file.thumbnailLink,
//         webContentLink: file.webContentLink,
//         webViewLink: file.webViewLink,
//         createdTime: file.createdTime,
//         modifiedTime: file.modifiedTime,
//         size: file.size,
//       };
//     } catch (error) {
//       console.error('Error getting image metadata:', error);
//       return null;
//     }
//   }

//   isEnabled(): boolean {
//     return ENV.GOOGLE_DRIVE_ENABLED && this.initialized;
//   }
// }

// export const driveService = new GoogleDriveService();