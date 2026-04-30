const User = require('../models/User')
const Project = require('../models/Project')
const { getRecommendations, generateBio } = require('../services/aiService')
const Group = require('../models/Group')

// GET /api/profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password')
    res.json(user)
  } catch (err) {
    res.status(500).json({ message: 'Failed to load profile', error: err?.message || 'Unknown error' })
  }
}

// PUT /api/profile
const updateProfile = async (req, res) => {
  try {
    const { skills, interests, preferredDomain, github, bio, photo, cgpa, researchInterests } = req.body
    const user = await User.findById(req.user._id)

    user.skills = skills ?? user.skills
    user.interests = interests ?? user.interests
    user.preferredDomain = preferredDomain ?? user.preferredDomain
    user.github = github ?? user.github
    user.bio = bio ?? user.bio
    user.photo = photo ?? user.photo
    user.cgpa = cgpa ?? user.cgpa
    user.researchInterests = researchInterests ?? user.researchInterests

    const updated = await user.save()
    res.json(updated)
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile', error: err?.message || 'Unknown error' })
  }
}

// POST /api/profile/generate-bio
const generateAIBio = async (req, res) => {
  try {
    const { name, skills, interests, preferredDomain, github, cgpa } = req.body
    const bioText = await generateBio({ name, skills, interests, preferredDomain, github, cgpa })
    res.json({ bio: bioText })
  } catch (err) {
    console.error('AI bio error:', err?.message || err)
    res.status(502).json({
      message: 'Bio generation failed. Check server configuration and try again.',
      error: err?.message || 'Unknown error',
    })
  }
}

// GET /api/profile/recommendations
const getAIRecommendations = async (req, res) => {
  try {
    const student = await User.findById(req.user._id).select('-password')
    if (!student) {
      return res.status(404).json({ message: 'User not found' })
    }

    const projects = await Project.find({ status: 'open' })
      .populate('supervisor', 'name email')
      .limit(25)

    const recommendations = await getRecommendations(student, projects)
    return res.json(recommendations)
  } catch (err) {
    console.error('AI recommendations error:', err?.message || err)
    return res.status(502).json({
      message: 'AI recommendations failed. Check server configuration and try again.',
      error: err?.message || 'Unknown error',
    })
  }
}

// GET /api/profile/group — current user's group (for profile UI)
const getMyGroupForProfile = async (req, res) => {
  try {
    if (!req.user.group) {
      return res.json(null)
    }

    const group = await Group.findById(req.user.group)
      .populate('leader', 'name email skills cgpa github photo')
      .populate('members', 'name email skills cgpa github photo')

    return res.json(group || null)
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load group', error: err?.message || 'Unknown error' })
  }
}

// GET /api/profile/user/:userId — public profile view (limited fields)
const getUserPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select(
      'name email role skills interests preferredDomain github bio cgpa photo researchInterests'
    )
    if (!user) return res.status(404).json({ message: 'User not found' })
    return res.json(user)
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load user profile', error: err?.message || 'Unknown error' })
  }
}

module.exports = {
  getProfile,
  updateProfile,
  getAIRecommendations,
  generateAIBio,
  getMyGroupForProfile,
  getUserPublicProfile,
}