const express = require('express')
const router = express.Router()

const { protect } = require('../middleware/authMiddleware')
const {
	createGroup,
	getMyGroup,
	searchStudents,
	inviteMember,
	removeMember,
	promoteMember,
	disbandGroup,
	leaveGroup,
} = require('../controllers/groupController')

router.post('/', protect, createGroup)
router.get('/mine', protect, getMyGroup)
router.get('/search', protect, searchStudents)
router.post('/:id/invite', protect, inviteMember)
router.delete('/:id/member/:userId', protect, removeMember)
router.put('/:id/promote/:userId', protect, promoteMember)
router.delete('/:id', protect, disbandGroup)
router.post('/:id/leave', protect, leaveGroup)

module.exports = router
