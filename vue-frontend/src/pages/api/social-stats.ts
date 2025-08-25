// API route untuk mengambil data social media
// File: src/pages/api/social-stats.ts

export async function GET() {
  try {
    const socialData = {
      instagram: await fetchInstagramStats(),
      twitter: await fetchTwitterStats(),
      linkedin: await fetchLinkedInStats(),
      youtube: await fetchYouTubeStats()
    };

    return new Response(JSON.stringify({
      success: true,
      data: socialData,
      lastUpdated: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      }
    });
  } catch (error) {
    console.error('Error fetching social media stats:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch social media data',
      data: getFallbackData()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

async function fetchInstagramStats() {
  const accessToken = import.meta.env.INSTAGRAM_ACCESS_TOKEN;
  const userId = import.meta.env.INSTAGRAM_USER_ID;
  
  if (!accessToken || !userId) {
    return { followers: 12500, following: 850 };
  }

  try {
    const response = await fetch(
      `https://graph.instagram.com/${userId}?fields=followers_count,following_count&access_token=${accessToken}`
    );
    
    if (!response.ok) throw new Error('Instagram API failed');
    
    const data = await response.json();
    return {
      followers: data.followers_count,
      following: data.following_count
    };
  } catch (error) {
    console.warn('Instagram API error:', error);
    return { followers: 12500, following: 850 };
  }
}

async function fetchTwitterStats() {
  const bearerToken = import.meta.env.TWITTER_BEARER_TOKEN;
  const username = import.meta.env.TWITTER_USERNAME || 'sagawagroup';
  
  if (!bearerToken) {
    return { followers: 8200, following: 320 };
  }

  try {
    const response = await fetch(
      `https://api.twitter.com/2/users/by/username/${username}?user.fields=public_metrics`,
      {
        headers: {
          'Authorization': `Bearer ${bearerToken}`
        }
      }
    );
    
    if (!response.ok) throw new Error('Twitter API failed');
    
    const data = await response.json();
    return {
      followers: data.data.public_metrics.followers_count,
      following: data.data.public_metrics.following_count
    };
  } catch (error) {
    console.warn('Twitter API error:', error);
    return { followers: 8200, following: 320 };
  }
}

async function fetchLinkedInStats() {
  const accessToken = import.meta.env.LINKEDIN_ACCESS_TOKEN;
  const companyId = import.meta.env.LINKEDIN_COMPANY_ID;
  
  if (!accessToken || !companyId) {
    return { followers: 3400, connections: 1200 };
  }

  try {
    const response = await fetch(
      `https://api.linkedin.com/v2/networkSizes/${companyId}?edgeType=CompanyFollowedByMember`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    if (!response.ok) throw new Error('LinkedIn API failed');
    
    const data = await response.json();
    return {
      followers: data.firstDegreeSize,
      connections: data.secondDegreeSize || 1200
    };
  } catch (error) {
    console.warn('LinkedIn API error:', error);
    return { followers: 3400, connections: 1200 };
  }
}

async function fetchYouTubeStats() {
  const apiKey = import.meta.env.YOUTUBE_API_KEY;
  const channelId = import.meta.env.YOUTUBE_CHANNEL_ID;
  
  if (!apiKey || !channelId) {
    return { subscribers: 25000, videos: 180 };
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${apiKey}`
    );
    
    if (!response.ok) throw new Error('YouTube API failed');
    
    const data = await response.json();
    const stats = data.items[0].statistics;
    
    return {
      subscribers: parseInt(stats.subscriberCount),
      videos: parseInt(stats.videoCount)
    };
  } catch (error) {
    console.warn('YouTube API error:', error);
    return { subscribers: 25000, videos: 180 };
  }
}

function getFallbackData() {
  return {
    instagram: { followers: 12500, following: 850 },
    twitter: { followers: 8200, following: 320 },
    linkedin: { followers: 3400, connections: 1200 },
    youtube: { subscribers: 25000, videos: 180 }
  };
}
