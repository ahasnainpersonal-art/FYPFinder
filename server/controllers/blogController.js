const BlogPost = require('../models/BlogPost')

const getPosts = async (req, res) => {
  try {
    const posts = await BlogPost.find()
      .populate('author', 'name role')
      .populate({ path: 'linkedProject', select: 'title supervisor', populate: { path: 'supervisor', select: 'name email' } })
      .sort({ createdAt: -1 })
    res.json(posts)
  } catch (err) {
    res.status(500).json({ message: 'Failed to load posts', error: err?.message || 'Unknown error' })
  }
}

const createPost = async (req, res) => {
  try {
    const { title, content, tag } = req.body
    if (!title || !content) {
      return res.status(400).json({ message: 'title and content are required' })
    }

    const post = await BlogPost.create({
      title,
      content,
      tag: tag || 'Tips',
      author: req.user._id,
      isIndustrialShowcase: false,
      linkedProject: null,
      likes: 0,
      likedBy: [],
      comments: [],
    })

    const populated = await BlogPost.findById(post._id).populate('author', 'name role')
    res.status(201).json(populated)
  } catch (err) {
    res.status(500).json({ message: 'Failed to create post', error: err?.message || 'Unknown error' })
  }
}

// POST /api/blog/:id/like — toggle like
const toggleLike = async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id)
    if (!post) return res.status(404).json({ message: 'Post not found' })

    const userId = req.user._id.toString()
    const likedIndex = post.likedBy.findIndex((id) => id.toString() === userId)

    if (likedIndex >= 0) {
      post.likedBy.splice(likedIndex, 1)
    } else {
      post.likedBy.push(req.user._id)
    }

    post.likes = post.likedBy.length
    const updated = await post.save()
    const populated = await BlogPost.findById(updated._id)
      .populate('author', 'name role')
      .populate({ path: 'linkedProject', select: 'title supervisor', populate: { path: 'supervisor', select: 'name email' } })
    res.json(populated)
  } catch (err) {
    res.status(500).json({ message: 'Failed to like post', error: err?.message || 'Unknown error' })
  }
}

// POST /api/blog/:id/comment
const addComment = async (req, res) => {
  try {
    const { text } = req.body
    if (!text) return res.status(400).json({ message: 'text is required' })

    const post = await BlogPost.findById(req.params.id)
    if (!post) return res.status(404).json({ message: 'Post not found' })

    post.comments.unshift({
      user: req.user._id,
      name: req.user.name,
      text,
      createdAt: new Date(),
    })

    const updated = await post.save()
    const populated = await BlogPost.findById(updated._id)
      .populate('author', 'name role')
      .populate({ path: 'linkedProject', select: 'title supervisor', populate: { path: 'supervisor', select: 'name email' } })
    res.json(populated)
  } catch (err) {
    res.status(500).json({ message: 'Failed to comment', error: err?.message || 'Unknown error' })
  }
}

const deletePost = async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id)
    if (!post) return res.status(404).json({ message: 'Post not found' })

    const isAdmin = req.user?.role === 'admin'
    const isAuthor = String(post.author) === String(req.user._id)
    if (!isAdmin && !isAuthor) {
      return res.status(403).json({ message: 'Not authorized to delete this post' })
    }

    await post.deleteOne()
    res.json({ message: 'Post deleted' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete post', error: err?.message || 'Unknown error' })
  }
}

module.exports = { getPosts, createPost, toggleLike, addComment, deletePost }