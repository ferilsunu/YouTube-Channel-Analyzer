const { fetchChannelData } = require('../services/youtubeService');

module.exports = {
  getHome: async (req, res) => {
    const channelQuery = req.query.channel || req.query.q || 'mkbhd';
    try {
      const data = await fetchChannelData(channelQuery, process.env.API_KEY);
      res.render('dashboard', {
        layout: 'dashboardLayout',
        data,
        searchQuery: channelQuery
      });
    } catch (err) {
      console.error('Home render error:', err.message);
      res.render('dashboard', {
        layout: 'dashboardLayout',
        error: err.message || 'Unable to load channel data',
        searchQuery: channelQuery
      });
    }
  },

  getAnalyzeApi: async (req, res) => {
    const query = req.query.q || req.query.channel;
    if (!query) {
      return res.status(400).json({ success: false, error: 'Query parameter q is required' });
    }

    try {
      const data = await fetchChannelData(query, process.env.API_KEY);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error('API analyze error:', err.message);
      return res.status(404).json({ success: false, error: err.message || 'Channel not found' });
    }
  },

  postDashboard: async (req, res) => {
    const channelName = req.body && req.body.channelName ? req.body.channelName.trim() : '';
    if (!channelName) {
      return res.redirect('/');
    }
    return res.redirect(`/?channel=${encodeURIComponent(channelName)}`);
  }
};