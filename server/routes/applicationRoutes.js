const express = require('express')
const router = express.Router()
const {
	generateProposalForProject,
	createApplication,
	getMyApplications,
	getApplicantsForProject,
	updateApplicationStatus,
	getProposedIdeasForSupervisor,
	getIndustrialApplicants,
} = require('../controllers/applicationController')
const { protect } = require('../middleware/authMiddleware')

router.post('/', protect, createApplication)
router.post('/generate-proposal', protect, generateProposalForProject)
router.get('/mine', protect, getMyApplications)
router.get('/project/:projectId', protect, getApplicantsForProject)
router.get('/industrial/:projectId', protect, getIndustrialApplicants)
router.get('/supervisor/proposed', protect, getProposedIdeasForSupervisor)
router.put('/:id/status', protect, updateApplicationStatus)

module.exports = router