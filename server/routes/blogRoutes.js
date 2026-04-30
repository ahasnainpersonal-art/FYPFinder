const express = require('express')
const router = express.Router()
const { getPosts, createPost, toggleLike, addComment, deletePost } = require('../controllers/blogController')
const { protect } = require('../middleware/authMiddleware')

router.get('/', getPosts)
router.post('/', protect, createPost)
router.post('/:id/like', protect, toggleLike)
router.post('/:id/comment', protect, addComment)
router.delete('/:id', protect, deletePost)

module.exports = router