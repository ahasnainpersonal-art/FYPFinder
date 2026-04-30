const Application = require('../models/Application')
const Project = require('../models/Project')
const Group = require('../models/Group')
const { generateProposal } = require('../services/aiService')
const mongoose = require('mongoose')

const cgpaMid = (cgpaRange) => {
  const map = {
    '2.0-2.5': 2.25,
    '2.5-3.0': 2.75,
    '3.0-3.5': 3.25,
    '3.5-4.0': 3.75,
  }
  return map[String(cgpaRange || '')] ?? 0
}

const groupAverageCgpa = (group) => {
  const members = group?.members || []
  if (!Array.isArray(members) || members.length === 0) return 0
  const sum = members.reduce((acc, m) => acc + cgpaMid(m?.cgpa), 0)
  return sum / members.length
}

const populateGroupDetails = {
  path: 'group',
  populate: [
    { path: 'leader', select: 'name email skills cgpa github bio photo' },
    { path: 'members', select: 'name email skills cgpa github bio photo' },
  ],
}

// POST /api/applications/generate-proposal — AI proposal generator for a project + current group
const generateProposalForProject = async (req, res) => {
  try {
    const { projectId } = req.body
    if (!projectId) return res.status(400).json({ message: 'projectId is required' })
    if (!mongoose.Types.ObjectId.isValid(String(projectId))) {
      return res.status(400).json({ message: 'Invalid projectId' })
    }

    const group = await Group.findOne({ members: req.user._id })
      .populate('members', 'name cgpa skills github')
      .populate('leader', 'name cgpa skills github')

    if (!group) return res.status(400).json({ message: 'You must be in a group to generate a proposal' })
    if (String(group.leader?._id || group.leader) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only group leader can generate proposals' })
    }

    if (group.members.length < 2 || group.members.length > 3) {
      return res.status(400).json({ message: 'Group must have minimum 2 and maximum 3 members' })
    }

    const project = await Project.findById(projectId).select('title description domain')
    if (!project) return res.status(404).json({ message: 'Project not found' })

    const members = Array.isArray(group.members) ? group.members : []
    const proposal = await generateProposal({ project, members })
    return res.json(proposal)
  } catch (err) {
    console.error('AI proposal error:', err?.message || err)
    const msg = String(err?.message || '')
    if (msg.toLowerCase().includes('api limit reached')) {
      return res.status(429).json({ message: 'API limit reached' })
    }
    return res.status(502).json({ message: 'Proposal generation failed', error: err?.message || 'Unknown error' })
  }
}

// POST /api/applications — group leader submits application
const createApplication = async (req, res) => {
  try {
    const { type, projectId, proposedTitle, proposedDescription, targetSupervisor, pitch, proposal } = req.body

    if (!type) return res.status(400).json({ message: 'type is required' })
    let finalPitch = pitch
    if (!finalPitch && proposal?.whyThisGroup) {
      finalPitch = String(proposal.whyThisGroup)
    }
    if (!finalPitch) return res.status(400).json({ message: 'pitch is required' })

    const group = await Group.findOne({ members: req.user._id })
    if (!group) return res.status(400).json({ message: 'You must be in a group to apply' })
    if (String(group.leader) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only group leader can submit applications' })
    }

    if (group.members.length < 2) {
      return res.status(400).json({ message: 'Form a group of 2 or 3 to apply' })
    }
    if (group.members.length > 3) {
      return res.status(400).json({ message: 'Group must have maximum 3 members before applying' })
    }

    // A group can only apply to one thing at a time
    const active = await Application.findOne({
      group: group._id,
      status: { $in: ['pending', 'approved'] },
    })
    if (active) {
      return res.status(400).json({ message: 'Your group already has an active application' })
    }

    if (type === 'group_to_project') {
      if (!projectId) return res.status(400).json({ message: 'projectId is required for group_to_project' })
      if (!mongoose.Types.ObjectId.isValid(String(projectId))) {
        return res.status(400).json({ message: 'Invalid projectId' })
      }

      const project = await Project.findById(projectId)
      if (!project) return res.status(404).json({ message: 'Project not found' })

      if (project.assignedGroup) {
        return res.status(400).json({ message: 'A group is already approved for this project' })
      }

      const existingApproved = await Application.findOne({
        type: 'group_to_project',
        project: projectId,
        status: 'approved',
      })
      if (existingApproved) {
        return res.status(400).json({ message: 'A group is already approved for this project' })
      }

      const app = await Application.create({
        type,
        group: group._id,
        project: projectId,
        pitch: finalPitch,
        proposal: proposal || undefined,
        status: 'pending',
      })

      const populated = await Application.findById(app._id)
        .populate(populateGroupDetails)
        .populate('project', 'title domain supervisor')

      return res.status(201).json(populated)
    }

    if (type === 'group_proposing_idea') {
      if (!proposedTitle || !proposedDescription) {
        return res.status(400).json({ message: 'proposedTitle and proposedDescription are required' })
      }

      const app = await Application.create({
        type,
        group: group._id,
        proposedTitle,
        proposedDescription,
        targetSupervisor: targetSupervisor || null,
        pitch: finalPitch,
        proposal: proposal || undefined,
        status: 'pending',
      })

      const populated = await Application.findById(app._id)
        .populate(populateGroupDetails)
        .populate('targetSupervisor', 'name email')

      return res.status(201).json(populated)
    }

    return res.status(400).json({ message: 'Invalid application type' })
  } catch (err) {
    console.error('Create application error:', err)

    // Convert common Mongoose failures into actionable 4xx messages
    if (err?.name === 'ValidationError' || err?.name === 'CastError') {
      return res.status(400).json({ message: err?.message || 'Invalid application data' })
    }

    const msg = String(err?.message || '')
    if (msg.includes('project is required for group_to_project') || msg.includes('proposedTitle and proposedDescription')) {
      return res.status(400).json({ message: msg })
    }

    if (err?.code === 11000) {
      return res.status(400).json({ message: 'Duplicate application data' })
    }
    if (msg.toLowerCase().includes('not authorized') || msg.toLowerCase().includes('not authorized')) {
      return res.status(401).json({ message: 'Not authorized' })
    }

    return res.status(500).json({ message: err?.message || 'Failed to create application' })
  }
}

// GET /api/applications/mine — group leader sees their group's applications
const getMyApplications = async (req, res) => {
  try {
    const group = await Group.findOne({ members: req.user._id })
    if (!group) return res.json([])
    if (String(group.leader) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only group leader can view group applications' })
    }

    const apps = await Application.find({ group: group._id })
      .sort({ createdAt: -1 })
      .populate(populateGroupDetails)
      .populate('project', 'title domain supervisor')
      .populate('targetSupervisor', 'name email')

    return res.json(apps)
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load applications', error: err?.message || 'Unknown error' })
  }
}

// GET /api/applications/project/:projectId — supervisor sees all group applications for their project
const getApplicantsForProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
    if (!project) return res.status(404).json({ message: 'Project not found' })

    if (String(project.supervisor) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not your project' })
    }

    const apps = await Application.find({
      type: 'group_to_project',
      project: req.params.projectId,
    })
      .sort({ createdAt: -1 })
      .populate(populateGroupDetails)

    return res.json(apps)
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load applicants', error: err?.message || 'Unknown error' })
  }
}

// PUT /api/applications/:id/status — supervisor approves or rejects
const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'status must be approved or rejected' })
    }

    const application = await Application.findById(req.params.id)
      .populate('project')
    if (!application) return res.status(404).json({ message: 'Application not found' })

    if (application.type !== 'group_to_project') {
      return res.status(400).json({ message: 'Only project applications can be approved/rejected here' })
    }

    const project = application.project
    if (!project) return res.status(400).json({ message: 'Application has no project' })
    if (String(project.supervisor) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    const prevStatus = application.status

    if (status === 'approved') {
      const alreadyAssigned = await Project.findById(project._id).select('assignedGroup')
      if (
        alreadyAssigned?.assignedGroup &&
        String(alreadyAssigned.assignedGroup) !== String(application.group)
      ) {
        return res.status(400).json({ message: 'Project already has an approved group' })
      }
    }

    application.status = status
    await application.save()

    if (status === 'approved') {
      await Project.findByIdAndUpdate(project._id, {
        assignedGroup: application.group,
      })

      await Application.updateMany(
        {
          _id: { $ne: application._id },
          type: 'group_to_project',
          project: project._id,
          status: 'pending',
        },
        { $set: { status: 'rejected' } }
      )
    }

    // If an approved application is rejected later, unlock the project.
    if (status === 'rejected' && prevStatus === 'approved') {
      const current = await Project.findById(project._id).select('assignedGroup')
      if (String(current?.assignedGroup || '') === String(application.group)) {
        await Project.findByIdAndUpdate(project._id, { assignedGroup: null })
      }
    }

    const populated = await Application.findById(application._id)
      .populate(populateGroupDetails)
      .populate('project', 'title domain supervisor assignedGroup')

    return res.json(populated)
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update status', error: err?.message || 'Unknown error' })
  }
}

// GET /api/applications/supervisor/proposed
const getProposedIdeasForSupervisor = async (req, res) => {
  try {
    const apps = await Application.find({
      type: 'group_proposing_idea',
      targetSupervisor: req.user._id,
    })
      .sort({ createdAt: -1 })
      .populate(populateGroupDetails)
      .populate('targetSupervisor', 'name email')

    return res.json(apps)
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load proposed ideas', error: err?.message || 'Unknown error' })
  }
}

// GET /api/applications/industrial/:projectId — sorted by avg CGPA desc
const getIndustrialApplicants = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
    if (!project) return res.status(404).json({ message: 'Project not found' })
    if (String(project.supervisor) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not your project' })
    }

    const apps = await Application.find({
      type: 'group_to_project',
      project: project._id,
    })
      .populate(populateGroupDetails)

    const enriched = apps
      .map((a) => {
        const avgCgpa = groupAverageCgpa(a.group)
        return { ...a.toObject(), avgCgpa }
      })
      .sort((a, b) => (b.avgCgpa || 0) - (a.avgCgpa || 0))

    return res.json(enriched)
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load industrial applicants', error: err?.message || 'Unknown error' })
  }
}

module.exports = {
  generateProposalForProject,
  createApplication,
  getMyApplications,
  getApplicantsForProject,
  updateApplicationStatus,
  getProposedIdeasForSupervisor,
  getIndustrialApplicants,
}