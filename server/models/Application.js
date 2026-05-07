const mongoose = require('mongoose')

const applicationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['group_to_project', 'group_proposing_idea'],
    required: true,
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null,
  },
  proposedTitle: {
    type: String,
    default: '',
  },
  proposedDescription: {
    type: String,
    default: '',
  },
  targetSupervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  pitch: {
    type: String,
    required: true,
  },
  proposal: {
    projectUnderstanding: { type: String, default: '' },
    proposedApproach: { type: String, default: '' },
    relevantSkills: { type: String, default: '' },
    timeline: { type: String, default: '' },
    whyThisGroup: { type: String, default: '' },
    memberDetails: [
      {
        name: { type: String, default: '' },
        cgpa: { type: String, default: '' },
        skills: { type: String, default: '' },
        github: { type: String, default: '' },
      },
    ],
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  proposalPDF: {
    type: String,
    default: ''
  },
}, { timestamps: true })

applicationSchema.pre('validate', function () {
  if (this.type === 'group_to_project' && !this.project) {
    this.invalidate('project', 'project is required for group_to_project')
  }

  if (this.type === 'group_proposing_idea' && (!this.proposedTitle || !this.proposedDescription)) {
    const msg = 'proposedTitle and proposedDescription are required for group_proposing_idea'
    this.invalidate('proposedTitle', msg)
    this.invalidate('proposedDescription', msg)
  }
})

module.exports = mongoose.model('Application', applicationSchema)