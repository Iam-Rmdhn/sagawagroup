#!/usr/bin/env node

/**
 * Test Script untuk Social Media API
 * Menguji koneksi dan response dari semua API yang digunakan
 * 
 * Usage: node test-api.mjs
 */

import fs from 'fs';
import path from 'path';

// Load environment variables
const loadEnv = () => {
  try {
    const envPath = path.resolve('.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
          process.env[key.trim()] = value.trim();
        }
      });
    } else {
      console.log('⚠️  .env file tidak ditemukan, menggunakan environment variables sistem');
    }
  } catch (error) {
    console.error('Error loading .env:', error.message);
  }
};

// Test Instagram API
const testInstagram = async () => {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const userId = process.env.INSTAGRAM_USER_ID;
  
  console.log('\n📸 Testing Instagram API...');
  
  if (!token || !userId) {
    console.log('❌ Instagram: Missing credentials');
    return false;
  }
  
  try {
    const url = `https://graph.instagram.com/${userId}?fields=account_type,media_count,followers_count,follows_count&access_token=${token}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.ok && data.followers_count !== undefined) {
      console.log('✅ Instagram: Connected successfully');
      console.log(`   - Followers: ${data.followers_count?.toLocaleString()}`);
      console.log(`   - Following: ${data.follows_count?.toLocaleString()}`);
      console.log(`   - Posts: ${data.media_count?.toLocaleString()}`);
      return true;
    } else {
      console.log('❌ Instagram: API Error');
      console.log('   Error:', data.error?.message || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.log('❌ Instagram: Network Error');
    console.log('   Error:', error.message);
    return false;
  }
};

// Test Twitter/X API
const testTwitter = async () => {
  const token = process.env.TWITTER_BEARER_TOKEN;
  const username = process.env.TWITTER_USERNAME;
  
  console.log('\n🐦 Testing Twitter/X API...');
  
  if (!token || !username) {
    console.log('❌ Twitter: Missing credentials');
    return false;
  }
  
  try {
    const url = `https://api.twitter.com/2/users/by/username/${username}?user.fields=public_metrics`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await response.json();
    
    if (response.ok && data.data?.public_metrics) {
      console.log('✅ Twitter: Connected successfully');
      console.log(`   - Followers: ${data.data.public_metrics.followers_count?.toLocaleString()}`);
      console.log(`   - Following: ${data.data.public_metrics.following_count?.toLocaleString()}`);
      console.log(`   - Tweets: ${data.data.public_metrics.tweet_count?.toLocaleString()}`);
      return true;
    } else {
      console.log('❌ Twitter: API Error');
      console.log('   Error:', data.errors?.[0]?.message || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.log('❌ Twitter: Network Error');
    console.log('   Error:', error.message);
    return false;
  }
};

// Test LinkedIn API
const testLinkedIn = async () => {
  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  const companyId = process.env.LINKEDIN_COMPANY_ID;
  
  console.log('\n💼 Testing LinkedIn API...');
  
  if (!token || !companyId) {
    console.log('❌ LinkedIn: Missing credentials');
    return false;
  }
  
  try {
    const url = `https://api.linkedin.com/v2/companies/${companyId}?projection=(followerCount)`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await response.json();
    
    if (response.ok && data.followerCount !== undefined) {
      console.log('✅ LinkedIn: Connected successfully');
      console.log(`   - Followers: ${data.followerCount?.toLocaleString()}`);
      return true;
    } else {
      console.log('❌ LinkedIn: API Error');
      console.log('   Error:', data.message || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.log('❌ LinkedIn: Network Error');
    console.log('   Error:', error.message);
    return false;
  }
};

// Test YouTube API
const testYouTube = async () => {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  
  console.log('\n📺 Testing YouTube API...');
  
  if (!apiKey || !channelId) {
    console.log('❌ YouTube: Missing credentials');
    return false;
  }
  
  try {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.ok && data.items?.[0]?.statistics) {
      const stats = data.items[0].statistics;
      console.log('✅ YouTube: Connected successfully');
      console.log(`   - Subscribers: ${parseInt(stats.subscriberCount)?.toLocaleString()}`);
      console.log(`   - Videos: ${parseInt(stats.videoCount)?.toLocaleString()}`);
      console.log(`   - Views: ${parseInt(stats.viewCount)?.toLocaleString()}`);
      return true;
    } else {
      console.log('❌ YouTube: API Error');
      console.log('   Error:', data.error?.message || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.log('❌ YouTube: Network Error');
    console.log('   Error:', error.message);
    return false;
  }
};

// Test Internal API
const testInternalAPI = async () => {
  console.log('\n🔧 Testing Internal API...');
  
  try {
    const response = await fetch('http://localhost:4321/api/social-stats');
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Internal API: Working correctly');
      console.log('   Available platforms:', Object.keys(data.data).join(', '));
      return true;
    } else {
      console.log('❌ Internal API: Error');
      console.log('   Error:', data.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.log('⚠️  Internal API: Server not running');
    console.log('   Start server with: npm run dev');
    return false;
  }
};

// Main function
const main = async () => {
  console.log('🚀 Social Media API Test Script');
  console.log('==================================');
  
  // Load environment variables
  loadEnv();
  
  // Test all APIs
  const results = await Promise.all([
    testInstagram(),
    testTwitter(),
    testLinkedIn(),
    testYouTube(),
  ]);
  
  // Test internal API
  const internalResult = await testInternalAPI();
  
  // Summary
  console.log('\n📊 Summary');
  console.log('==========');
  const successCount = results.filter(Boolean).length;
  const totalTests = results.length;
  
  console.log(`✅ External APIs: ${successCount}/${totalTests} working`);
  console.log(`🔧 Internal API: ${internalResult ? 'Working' : 'Not available'}`);
  
  if (successCount === totalTests) {
    console.log('\n🎉 All APIs configured correctly!');
    console.log('   Your social media popover is ready to use.');
  } else {
    console.log('\n⚠️  Some APIs need configuration.');
    console.log('   Check your .env file and API credentials.');
  }
  
  console.log('\n📚 For setup instructions, see: SOCIAL_MEDIA_SETUP.md');
};

// Run the script
main().catch(console.error);
