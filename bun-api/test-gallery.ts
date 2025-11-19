// import { driveService } from './src/services/drive.service';

// async function testGallery() {
//   console.log('Testing Google Drive Gallery Integration...\n');
  
//   // Check if service is enabled
//   console.log('1. Checking if Google Drive is enabled...');
//   const isEnabled = driveService.isEnabled();
//   console.log(`   Status: ${isEnabled ? '✅ Enabled' : '❌ Disabled'}\n`);
  
//   if (!isEnabled) {
//     console.log('Google Drive is not enabled. Please check your configuration.');
//     return;
//   }
  
//   // Try to fetch images
//   console.log('2. Fetching gallery images from Google Drive...');
//   try {
//     const images = await driveService.getGalleryImages();
//     console.log(`   Found ${images.length} images\n`);
    
//     if (images.length > 0) {
//       console.log('3. Sample images:');
//       images.slice(0, 3).forEach((img, idx) => {
//         console.log(`   ${idx + 1}. ${img.name}`);
//         console.log(`      ID: ${img.id}`);
//         console.log(`      Type: ${img.mimeType}`);
//         console.log(`      Thumbnail: ${img.thumbnailLink ? '✅' : '❌'}`);
//         console.log(`      Web Link: ${img.webContentLink ? '✅' : '❌'}`);
//         console.log('');
//       });
//     } else {
//       console.log('   ⚠️  No images found in the folder.');
//       console.log('   Please check:');
//       console.log('   - Folder ID is correct');
//       console.log('   - Folder contains image files (JPG, PNG, GIF, etc.)');
//       console.log('   - Service account has permission to access the folder');
//     }
//   } catch (error) {
//     console.error('   ❌ Error:', error);
//     console.log('\n   Possible issues:');
//     console.log('   - Service account key file is invalid');
//     console.log('   - Folder ID is incorrect');
//     console.log('   - Service account doesn\'t have permission to access folder');
//   }
// }

// testGallery();
