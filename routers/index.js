const express = require('express');
const router = express.Router();
const { getHome, getAnalyzeApi, postDashboard } = require('../controllers/index');

router.get('/', getHome);
router.get('/analyze', getHome);
router.get('/api/analyze', getAnalyzeApi);
router.post('/dashboard', postDashboard);

module.exports = router;