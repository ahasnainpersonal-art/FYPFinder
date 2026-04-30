const User = require('../models/User')

// GET /api/users/students/search?q=...
// Protected: returns minimal fields for student lookup (typeahead)
const searchStudents = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim()
    if (!q) return res.json([])

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')

    const users = await User.find({
      role: 'student',
      $or: [{ name: regex }, { email: regex }],
    })
      .select('name email cgpa skills github')
      .sort({ name: 1 })
      .limit(20)

    return res.json(users)
  } catch (err) {
    return res.status(500).json({ message: 'Failed to search students', error: err?.message || 'Unknown error' })
  }
}

module.exports = { searchStudents }
