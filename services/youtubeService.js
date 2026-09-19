/**
 * YouTube Channel Intelligence Service
 * Handles channel resolving, playlist uploads querying, batch video metrics,
 * engagement rate analysis, monetization estimates, and SEO intelligence.
 */

const convertNumber = (n) => {
  if (n === undefined || n === null || isNaN(n)) return '0';
  const num = Number(n);
  if (num < 1e3) return num.toLocaleString();
  if (num >= 1e3 && num < 1e6) return +(num / 1e3).toFixed(1) + 'K';
  if (num >= 1e6 && num < 1e9) return +(num / 1e6).toFixed(1) + 'M';
  if (num >= 1e9 && num < 1e12) return +(num / 1e9).toFixed(1) + 'B';
  return +(num / 1e12).toFixed(1) + 'T';
};

const parseISO8601Duration = (durationStr) => {
  if (!durationStr) return { formatted: '--', seconds: 0, isShort: false };
  const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return { formatted: durationStr, seconds: 0, isShort: false };
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  const isShort = totalSeconds <= 60;

  let formatted = '';
  if (hours > 0) {
    formatted = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  return { formatted, seconds: totalSeconds, isShort };
};

const getRelativeTime = (isoDate) => {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears}y ago`;
};

const cleanSearchQuery = (query) => {
  if (!query || typeof query !== 'string') return '';
  let q = query.trim();

  // Strip full YouTube URLs
  if (q.includes('youtube.com/') || q.includes('youtu.be/')) {
    try {
      const url = new URL(q.startsWith('http') ? q : `https://${q}`);
      if (url.pathname.includes('/@')) {
        return url.pathname.split('/@')[1].split('/')[0];
      }
      if (url.pathname.includes('/channel/')) {
        return url.pathname.split('/channel/')[1].split('/')[0];
      }
      if (url.pathname.includes('/c/') || url.pathname.includes('/user/')) {
        return url.pathname.split('/')[2];
      }
    } catch (e) {}
  }

  return q.replace(/^@/, '');
};

async function fetchChannelData(query, apiKey) {
  if (!apiKey) {
    throw new Error('YOUTUBE_API_KEY is not configured in server environment');
  }

  const cleanQuery = cleanSearchQuery(query);
  if (!cleanQuery) {
    throw new Error('Please provide a channel name or handle');
  }

  let channelId = null;

  // 1. Try resolving via forHandle
  try {
    const handleUrl = `https://www.googleapis.com/youtube/v3/channels?key=${apiKey}&part=snippet,statistics,contentDetails,brandingSettings,topicDetails,status&forHandle=${encodeURIComponent(cleanQuery)}`;
    const handleRes = await fetch(handleUrl);
    if (handleRes.ok) {
      const handleData = await handleRes.json();
      if (handleData.items && handleData.items.length > 0) {
        return await processChannelDetails(handleData.items[0], apiKey);
      }
    }
  } catch (e) {
    console.warn('forHandle lookup failed, falling back to ID/Search:', e.message);
  }

  // 2. Try direct Channel ID lookup if query starts with UC
  if (cleanQuery.startsWith('UC') && cleanQuery.length >= 20) {
    try {
      const idUrl = `https://www.googleapis.com/youtube/v3/channels?key=${apiKey}&part=snippet,statistics,contentDetails,brandingSettings,topicDetails,status&id=${encodeURIComponent(cleanQuery)}`;
      const idRes = await fetch(idUrl);
      if (idRes.ok) {
        const idData = await idRes.json();
        if (idData.items && idData.items.length > 0) {
          return await processChannelDetails(idData.items[0], apiKey);
        }
      }
    } catch (e) {}
  }

  // 3. Try forUsername lookup
  try {
    const userUrl = `https://www.googleapis.com/youtube/v3/channels?key=${apiKey}&part=snippet,statistics,contentDetails,brandingSettings,topicDetails,status&forUsername=${encodeURIComponent(cleanQuery)}`;
    const userRes = await fetch(userUrl);
    if (userRes.ok) {
      const userData = await userRes.json();
      if (userData.items && userData.items.length > 0) {
        return await processChannelDetails(userData.items[0], apiKey);
      }
    }
  } catch (e) {}

  // 4. Fallback: Search for channel
  const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&part=snippet&type=channel&maxResults=1&q=${encodeURIComponent(cleanQuery)}`;
  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) {
    throw new Error(`YouTube Search API returned status ${searchRes.status}`);
  }

  const searchData = await searchRes.json();
  if (!searchData.items || searchData.items.length === 0) {
    throw new Error(`No YouTube channel found for "${cleanQuery}"`);
  }

  channelId = searchData.items[0].id && searchData.items[0].id.channelId;
  if (!channelId) {
    throw new Error(`Could not resolve channel ID for "${cleanQuery}"`);
  }

  const channelUrl = `https://www.googleapis.com/youtube/v3/channels?key=${apiKey}&part=snippet,statistics,contentDetails,brandingSettings,topicDetails,status&id=${channelId}`;
  const channelRes = await fetch(channelUrl);
  if (!channelRes.ok) {
    throw new Error(`Failed to fetch channel details for ID ${channelId}`);
  }

  const channelData = await channelRes.json();
  if (!channelData.items || channelData.items.length === 0) {
    throw new Error(`Channel details not found for ID ${channelId}`);
  }

  return await processChannelDetails(channelData.items[0], apiKey);
}

async function processChannelDetails(channelItem, apiKey) {
  const snippet = channelItem.snippet || {};
  const stats = channelItem.statistics || {};
  const branding = channelItem.brandingSettings || {};
  const contentDetails = channelItem.contentDetails || {};
  const topicDetails = channelItem.topicDetails || {};
  const status = channelItem.status || {};

  const totalViews = Number(stats.viewCount || 0);
  const totalSubs = Number(stats.subscriberCount || 0);
  const totalVideos = Number(stats.videoCount || 0);

  // Calculate Join Date & Lifetime in months
  const publishedAt = snippet.publishedAt ? new Date(snippet.publishedAt) : new Date();
  const now = new Date();
  const monthsActive = Math.max(1, (now.getFullYear() - publishedAt.getFullYear()) * 12 + (now.getMonth() - publishedAt.getMonth()));
  const joinDateFormatted = publishedAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const uploadsPerMonth = (totalVideos / monthsActive).toFixed(1);
  const avgViewsPerVideo = totalVideos > 0 ? Math.round(totalViews / totalVideos) : 0;

  // Banner
  const bannerUrl = branding.image?.bannerExternalUrl 
    ? `${branding.image.bannerExternalUrl}=w1707-fcrop64=1,00005a57ffffa5a8-k-c0xffffffff-no-nd-rj` 
    : null;

  // Custom Handle
  const handle = snippet.customUrl ? (snippet.customUrl.startsWith('@') ? snippet.customUrl : `@${snippet.customUrl}`) : `@${snippet.title.toLowerCase().replace(/\s+/g, '')}`;

  // Fetch recent videos from uploads playlist
  const uploadsPlaylistId = contentDetails.relatedPlaylists?.uploads;
  let recentVideos = [];
  let extractedTags = {};
  let totalRecentViews = 0;
  let totalRecentLikes = 0;
  let totalRecentComments = 0;
  let shortsCount = 0;
  let longformCount = 0;

  if (uploadsPlaylistId) {
    try {
      const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?key=${apiKey}&part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=12`;
      const plRes = await fetch(playlistUrl);
      if (plRes.ok) {
        const plData = await plRes.json();
        const videoIds = (plData.items || []).map(i => i.contentDetails?.videoId).filter(Boolean);

        if (videoIds.length > 0) {
          const videosUrl = `https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&part=snippet,contentDetails,statistics&id=${videoIds.join(',')}`;
          const vRes = await fetch(videosUrl);
          if (vRes.ok) {
            const vData = await vRes.json();
            recentVideos = (vData.items || []).map(v => {
              const vSnippet = v.snippet || {};
              const vStats = v.statistics || {};
              const vContent = v.contentDetails || {};

              const vViews = Number(vStats.viewCount || 0);
              const vLikes = Number(vStats.likeCount || 0);
              const vComments = Number(vStats.commentCount || 0);
              const durationObj = parseISO8601Duration(vContent.duration);

              totalRecentViews += vViews;
              totalRecentLikes += vLikes;
              totalRecentComments += vComments;

              if (durationObj.isShort) shortsCount++;
              else longformCount++;

              // Collect tags
              if (Array.isArray(vSnippet.tags)) {
                vSnippet.tags.slice(0, 8).forEach(t => {
                  const cleaned = t.trim().toLowerCase();
                  if (cleaned.length > 2 && cleaned.length < 30) {
                    extractedTags[cleaned] = (extractedTags[cleaned] || 0) + 1;
                  }
                });
              }

              const thumb = vSnippet.thumbnails?.maxres?.url || 
                            vSnippet.thumbnails?.high?.url || 
                            vSnippet.thumbnails?.medium?.url || 
                            vSnippet.thumbnails?.default?.url;

              return {
                id: v.id,
                title: vSnippet.title,
                description: vSnippet.description ? vSnippet.description.slice(0, 140) + '...' : '',
                publishedAt: vSnippet.publishedAt,
                relativeTime: getRelativeTime(vSnippet.publishedAt),
                thumbnail: thumb,
                duration: durationObj.formatted,
                isShort: durationObj.isShort,
                viewCount: convertNumber(vViews),
                rawViews: vViews,
                likeCount: convertNumber(vLikes),
                commentCount: convertNumber(vComments),
                tags: vSnippet.tags || []
              };
            });
          }
        }
      }
    } catch (e) {
      console.warn('Error fetching detailed videos:', e.message);
    }
  }

  // Calculate Engagement Rate
  const validRecentCount = recentVideos.length || 1;
  const recentAvgViews = Math.round(totalRecentViews / validRecentCount);
  const engagementRate = totalRecentViews > 0 
    ? (((totalRecentLikes + totalRecentComments) / totalRecentViews) * 100).toFixed(2)
    : '0.00';

  // Calculate Estimated Earnings (CPM Model)
  // Standard RPM across niches: $1.50 (low), $3.50 (mid), $7.00 (high)
  const estMonthlyViews = Math.round(recentAvgViews * (Number(uploadsPerMonth) || 4));
  const estMonthlyEarningsLow = Math.round((estMonthlyViews / 1000) * 1.5);
  const estMonthlyEarningsMid = Math.round((estMonthlyViews / 1000) * 3.5);
  const estMonthlyEarningsHigh = Math.round((estMonthlyViews / 1000) * 7.0);

  const estYearlyEarningsLow = estMonthlyEarningsLow * 12;
  const estYearlyEarningsHigh = estMonthlyEarningsHigh * 12;

  // Health Score Calculation (0 - 100)
  let healthScore = 50;
  const engNum = parseFloat(engagementRate);
  if (engNum >= 5.0) healthScore += 25;
  else if (engNum >= 3.0) healthScore += 18;
  else if (engNum >= 1.5) healthScore += 10;

  if (Number(uploadsPerMonth) >= 4) healthScore += 15;
  else if (Number(uploadsPerMonth) >= 1) healthScore += 8;

  if (totalSubs > 1000000) healthScore += 10;
  else if (totalSubs > 100000) healthScore += 7;
  else if (totalSubs > 10000) healthScore += 4;

  let grade = 'B';
  if (healthScore >= 90) grade = 'A+';
  else if (healthScore >= 80) grade = 'A';
  else if (healthScore >= 70) grade = 'B+';
  else if (healthScore >= 60) grade = 'B';
  else grade = 'C';

  // Sort top tags
  const topTags = Object.entries(extractedTags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([tag, count]) => ({ tag, count }));

  // Topics
  const topicCategories = (topicDetails.topicCategories || []).map(url => {
    const parts = url.split('/');
    return parts[parts.length - 1].replace(/_/g, ' ');
  });

  return {
    channel: {
      id: channelItem.id,
      title: snippet.title,
      handle,
      description: snippet.description || 'No description provided.',
      customUrl: snippet.customUrl,
      avatar: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url,
      banner: bannerUrl,
      country: snippet.country || branding.channel?.country || 'Global',
      joinDate: joinDateFormatted,
      isForKids: status.madeForKids ? 'Yes' : 'No',
      trailerVideoId: branding.channel?.unsubscribedTrailer || null,
      channelUrl: `https://www.youtube.com/${handle}`
    },
    statistics: {
      subscribers: convertNumber(totalSubs),
      subscribersRaw: totalSubs,
      views: convertNumber(totalViews),
      viewsRaw: totalViews,
      videoCount: totalVideos.toLocaleString(),
      videoCountRaw: totalVideos,
      avgViewsPerVideo: convertNumber(avgViewsPerVideo),
      uploadsPerMonth,
      recentAvgViews: convertNumber(recentAvgViews)
    },
    analytics: {
      engagementRate: `${engagementRate}%`,
      engagementNum: engNum,
      healthScore,
      grade,
      shortsCount,
      longformCount,
      shortsPercent: validRecentCount > 0 ? Math.round((shortsCount / validRecentCount) * 100) : 0,
      longformPercent: validRecentCount > 0 ? Math.round((longformCount / validRecentCount) * 100) : 100,
      earnings: {
        monthlyRange: `$${convertNumber(estMonthlyEarningsLow)} - $${convertNumber(estMonthlyEarningsHigh)}`,
        yearlyRange: `$${convertNumber(estYearlyEarningsLow)} - $${convertNumber(estYearlyEarningsHigh)}`,
        monthlyMid: `$${convertNumber(estMonthlyEarningsMid)}`
      },
      topTags,
      topics: topicCategories
    },
    recentVideos
  };
}

module.exports = {
  fetchChannelData,
  convertNumber
};
