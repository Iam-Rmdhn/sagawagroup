// import { driveService } from '../services/drive.service';
// import type { DriveFile } from '../services/drive.service';

// export async function galleryRoute(req: Request): Promise<Response> {
//   const url = new URL(req.url);

//   // Health check endpoint
//   if (url.pathname === '/api/gallery/health') {
//     try {
//       const isEnabled = driveService.isEnabled();
//       const status = isEnabled ? 'healthy' : 'disabled';

//       return new Response(
//         JSON.stringify({
//           success: true,
//           status,
//           enabled: isEnabled,
//           folderId: isEnabled ? 'configured' : 'not configured',
//           timestamp: new Date().toISOString()
//         }),
//         {
//           status: 200,
//           headers: { 'Content-Type': 'application/json' }
//         }
//       );
//     } catch (error) {
//       console.error('Gallery health check error:', error);
//       return new Response(
//         JSON.stringify({
//           success: false,
//           status: 'error',
//           error: 'Health check failed'
//         }),
//         {
//           status: 500,
//           headers: { 'Content-Type': 'application/json' }
//         }
//       );
//     }
//   }

//   // Get all gallery images
//   if (url.pathname === '/api/gallery/images' && req.method === 'GET') {
//     try {
//       if (!driveService.isEnabled()) {
//         return new Response(
//           JSON.stringify({
//             success: false,
//             error: 'Google Drive integration is not enabled',
//             data: []
//           }),
//           {
//             status: 503,
//             headers: { 'Content-Type': 'application/json' }
//           }
//         );
//       }

//       const images: DriveFile[] = await driveService.getGalleryImages();

//       return new Response(
//         JSON.stringify({
//           success: true,
//           data: images,
//           count: images.length,
//           message: `Found ${images.length} images in gallery`
//         }),
//         {
//           status: 200,
//           headers: { 'Content-Type': 'application/json' }
//         }
//       );
//     } catch (error) {
//       console.error('Gallery API error:', error);
//       return new Response(
//         JSON.stringify({
//           success: false,
//           error: 'Failed to fetch gallery images',
//           data: []
//         }),
//         {
//           status: 500,
//           headers: { 'Content-Type': 'application/json' }
//         }
//       );
//     }
//   }

//   // Get single image metadata
//   const imageMatch = url.pathname.match(/^\/api\/gallery\/image\/(.+)$/);
//   if (imageMatch && req.method === 'GET') {
//     try {
//       const fileId = imageMatch[1];

//       if (!fileId) {
//         return new Response(
//           JSON.stringify({
//             success: false,
//             error: 'File ID is required'
//           }),
//           {
//             status: 400,
//             headers: { 'Content-Type': 'application/json' }
//           }
//         );
//       }

//       const imageData = await driveService.getImageMetadata(fileId);

//       if (!imageData) {
//         return new Response(
//           JSON.stringify({
//             success: false,
//             error: 'Image not found'
//           }),
//           {
//             status: 404,
//             headers: { 'Content-Type': 'application/json' }
//           }
//         );
//       }

//       return new Response(
//         JSON.stringify({
//           success: true,
//           data: imageData
//         }),
//         {
//           status: 200,
//           headers: { 'Content-Type': 'application/json' }
//         }
//       );
//     } catch (error) {
//       console.error('Gallery image API error:', error);
//       return new Response(
//         JSON.stringify({
//           success: false,
//           error: 'Failed to fetch image metadata'
//         }),
//         {
//           status: 500,
//           headers: { 'Content-Type': 'application/json' }
//         }
//       );
//     }
//   }

//   // Proxy image from Google Drive (to avoid CORS issues)
//   const proxyMatch = url.pathname.match(/^\/api\/gallery\/proxy\/(.+)$/);
//   if (proxyMatch && req.method === 'GET') {
//     const fileId = proxyMatch[1];

//     if (!fileId) {
//       return new Response('File ID is required', { status: 400 });
//     }

//     if (driveService.isEnabled()) {
//       try {
//         const imageData = await driveService.getImageBuffer(fileId);

//         return new Response(imageData.buffer, {
//           status: 200,
//           headers: {
//             'Content-Type': imageData.mimeType,
//             'Cache-Control': 'public, max-age=604800, immutable',
//             'Access-Control-Allow-Origin': '*',
//             'Content-Length': imageData.buffer.length.toString(),
//             'X-Proxy-Cache': imageData.fromCache ? 'HIT' : 'MISS',
//           }
//         });
//       } catch (error) {
//         console.error('Image proxy error (drive service):', error);
//         // fall through to public URL fetch
//       }
//     }

//     try {
//       const imageUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
//       const imageResponse = await fetch(imageUrl);

//       if (!imageResponse.ok) {
//         return new Response('Image not found', { status: 404 });
//       }

//       const imageBuffer = await imageResponse.arrayBuffer();
//       const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

//       return new Response(imageBuffer, {
//         status: 200,
//         headers: {
//           'Content-Type': contentType,
//           'Cache-Control': 'public, max-age=86400',
//           'Access-Control-Allow-Origin': '*',
//         }
//       });
//     } catch (fallbackError) {
//       console.error('Image proxy fallback error:', fallbackError);
//       return new Response('Failed to fetch image', { status: 500 });
//     }
//   }

//   return new Response('Not Found', { status: 404 });
// }

// export default galleryRoute;