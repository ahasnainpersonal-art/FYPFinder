const express = require('express')
const router = express.Router()
const { getAnalytics, getDomainAnalytics, getCashFlow, addCashFlow } = require('../controllers/adminController')
const { protect, adminOnly } = require('../middleware/authMiddleware')

router.get('/analytics', getAnalytics)
router.get('/analytics/domains', protect, adminOnly, getDomainAnalytics)
router.get('/cashflow', protect, adminOnly, getCashFlow)
router.post('/cashflow', protect, adminOnly, addCashFlow)

module.exports = router