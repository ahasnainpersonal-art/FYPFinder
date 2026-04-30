const CashFlow = require('../models/CashFlow')
const User = require('../models/User')
const Project = require('../models/Project')
const Application = require('../models/Application')

const getAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments()
    const totalStudents = await User.countDocuments({ role: 'student' })
    const totalSupervisors = await User.countDocuments({ role: 'supervisor' })
    const totalProjects = await Project.countDocuments()
    const totalApplications = await Application.countDocuments()
    const totalApproved = await Application.countDocuments({ status: 'approved' })

    res.json({
      totalUsers,
      totalStudents,
      totalSupervisors,
      totalProjects,
      totalApplications,
      totalApproved,
    })
  } catch (err) {
    res.status(500).json({ message: 'Failed to load analytics', error: err?.message || 'Unknown error' })
  }
}

// GET /api/admin/analytics/domains
const getDomainAnalytics = async (req, res) => {
  try {
    const grouped = await Project.aggregate([
      {
        $group: {
          _id: '$domain',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])

    const result = grouped.map((row) => ({ domain: row._id, count: row.count }))
    res.json(result)
  } catch (err) {
    res.status(500).json({ message: 'Failed to load domain analytics', error: err?.message || 'Unknown error' })
  }
}

const getCashFlow = async (req, res) => {
  try {
    const records = await CashFlow.find().sort({ createdAt: -1 })
    res.json(records)
  } catch (err) {
    res.status(500).json({ message: 'Failed to load cashflow', error: err?.message || 'Unknown error' })
  }
}

const addCashFlow = async (req, res) => {
  try {
    const record = await CashFlow.create(req.body)
    res.status(201).json(record)
  } catch (err) {
    res.status(500).json({ message: 'Failed to add cashflow record', error: err?.message || 'Unknown error' })
  }
}

module.exports = { getAnalytics, getDomainAnalytics, getCashFlow, addCashFlow }