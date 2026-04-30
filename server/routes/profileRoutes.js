const express = require('express')
const router = express.Router()
const {
	getProfile,
	updateProfile,
	getAIRecommendations,
	generateAIBio,
	getMyGroupForProfile,
	getUserPublicProfile,
} = require('../controllers/profileController')
const { protect } = require('../middleware/authMiddleware')

router.get('/', protect, getProfile)
router.put('/', protect, updateProfile)
router.post('/generate-bio', protect, generateAIBio)
router.get('/recommendations', protect, getAIRecommendations)
router.get('/group', protect, getMyGroupForProfile)
router.get('/user/:userId', getUserPublicProfile)

module.exports = router