const express = require('express')
const router = express.Router()

const {dashboardPostRequest,getDashboardRequest} = require('../controllers/dashboard')

router
    .route('/')
    .post(dashboardPostRequest)
    .get(getDashboardRequest)

module.exports = router