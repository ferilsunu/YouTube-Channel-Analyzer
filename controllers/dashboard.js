const convert = (n) => {
    if (n === undefined || n === null || isNaN(n)) return '0';
    if (n < 1e3) return n;
    if (n >= 1e3 && n < 1e6) return +(n / 1e3).toFixed(1) + 'K';
    if (n >= 1e6 && n < 1e9) return +(n / 1e6).toFixed(1) + 'M';
    if (n >= 1e9 && n < 1e12) return +(n / 1e9).toFixed(1) + 'B';
    if (n >= 1e12) return +(n / 1e12).toFixed(1) + 'T';
}

module.exports = {
    getDashboardRequest: (req, res) => {
        res.redirect('/')
    },
    dashboardPostRequest: async (req, res) => {
        const userSearchTerm = req.body && req.body.channelName ? req.body.channelName.trim() : '';
        if (!userSearchTerm) {
            return res.redirect('/');
        }

        try {
            const apiURLSearch = `https://www.googleapis.com/youtube/v3/search?key=${process.env.API_KEY}&part=snippet&maxResults=5&type=video&type=channel&sort=asc&q=${encodeURIComponent(userSearchTerm)}`;
            const searchResponse = await fetch(apiURLSearch);
            if (!searchResponse.ok) {
                console.error('YouTube search API error:', searchResponse.status, searchResponse.statusText);
                return res.redirect('/');
            }

            const parsedJsonData = await searchResponse.json();
            if (!parsedJsonData || !parsedJsonData.items || parsedJsonData.items.length === 0) {
                return res.redirect('/');
            }

            const data = parsedJsonData.items[0];
            const channelId = data && data.id ? data.id.channelId : null;
            if (!channelId) {
                return res.redirect('/');
            }

            const channelApiURL = `https://www.googleapis.com/youtube/v3/channels?key=${process.env.API_KEY}&part=snippet&part=statistics&part=status&part=brandingSettings&id=${channelId}`;
            const channelResponse = await fetch(channelApiURL);
            if (!channelResponse.ok) {
                console.error('YouTube channel API error:', channelResponse.status, channelResponse.statusText);
                return res.redirect('/');
            }

            const channelData = await channelResponse.json();
            if (!channelData || !channelData.items || channelData.items.length === 0) {
                return res.redirect('/');
            }

            // Recent Videos
            const videos = parsedJsonData.items
                .filter(i => i.id && i.id.videoId && i.snippet && i.snippet.thumbnails && i.snippet.thumbnails.high)
                .map((i) => ({
                    id: i.id.videoId,
                    thumbnails: i.snippet.thumbnails.high.url
                }));
            if (videos.length > 0) videos.shift();

            const channelStats = channelData.items[0];
            const views = channelStats.statistics && channelStats.statistics.viewCount ? Number(channelStats.statistics.viewCount) : 0;
            const earning = Math.floor(views * 0.18);
            const convertedEarning = convert(earning);

            if (channelStats.statistics) {
                channelStats.statistics.viewCount = convert(channelStats.statistics.viewCount);
                channelStats.statistics.subscriberCount = convert(channelStats.statistics.subscriberCount);
            }

            const isForKids = channelStats.status && channelStats.status.madeForKids ? 'Yes' : 'No';

            let join_date = '';
            if (channelStats.snippet && channelStats.snippet.publishedAt) {
                const join_date_iso = channelStats.snippet.publishedAt;
                const join_date_converted = new Date(join_date_iso);
                const join_date_year = join_date_converted.getFullYear();
                const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                const join_date_month = monthNames[join_date_converted.getMonth()];
                join_date = join_date_month + ' ' + join_date_year;
            }

            res.render('dashboard', {
                data,
                join_date,
                channelStats,
                isForKids,
                convertedEarning,
                videos
            });
        } catch (err) {
            console.error('Unexpected dashboard error:', err);
            res.redirect('/');
        }
    }
};
