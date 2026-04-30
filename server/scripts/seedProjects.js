require('dotenv').config()
const mongoose = require('mongoose')

const connectdb = require('../config/db')
const User = require('../models/User')
const Project = require('../models/Project')
const BlogPost = require('../models/BlogPost')

const sampleProjects = [
  {
    title: 'AI-Powered FYP Topic Recommender',
    description:
      'Build a system that recommends FYP topics using student interests, skills, and prior project trends. Include an explainability layer and evaluation metrics.',
    domain: 'AI',
    teamSize: 2,
    type: 'listed',
  },
  {
    title: 'Secure Campus Access (Zero Trust) Prototype',
    description:
      'Design a lightweight zero-trust access prototype for campus services with device posture checks, JWT auth integration, and audit logs.',
    domain: 'Cybersecurity',
    teamSize: 2,
    type: 'listed',
  },
  {
    title: 'Industrial: Smart Inventory Vision Inspection',
    description:
      'Industrial showcase project: detect damaged/incorrect inventory items from images and generate QC reports. Includes a dashboard and dataset versioning.',
    domain: 'AI',
    teamSize: 3,
    type: 'industrial',
  },
  {
    title: 'Industrial: Fleet Maintenance Web Portal',
    description:
      'Industrial showcase project: build a portal for maintenance scheduling, issue tracking, and analytics for a small fleet. Role-based views and reports.',
    domain: 'Web',
    teamSize: 3,
    type: 'industrial',
  },
  {
    title: 'Mobile Study Planner with Notifications',
    description:
      'Create a mobile planner for courses and deadlines, with offline-first storage and reminders. Include usability-focused features and a simple analytics view.',
    domain: 'Mobile',
    teamSize: 2,
    type: 'listed',
  },
  {
    title: 'R&D: Literature Mapper for Research Themes',
    description:
      'Prototype a tool that clusters papers by theme and visualizes relationships between keywords, abstracts, and citations. Focus on a small dataset MVP.',
    domain: 'R&D',
    teamSize: 2,
    type: 'listed',
  },
]

async function main() {
  const supervisorEmail = process.env.SUPERVISOR_EMAIL
  if (!supervisorEmail) {
    console.error('Missing SUPERVISOR_EMAIL in environment.')
    process.exit(1)
  }

  await connectdb()

  const supervisor = await User.findOne({ email: supervisorEmail, role: 'supervisor' })
  if (!supervisor) {
    console.error(`No supervisor found with email ${supervisorEmail}.`) 
    process.exit(1)
  }

  let createdCount = 0
  let skippedCount = 0

  for (const seed of sampleProjects) {
    const existing = await Project.findOne({ title: seed.title, supervisor: supervisor._id })
    if (existing) {
      skippedCount += 1
      continue
    }

    const project = await Project.create({
      title: seed.title,
      description: seed.description,
      domain: seed.domain,
      teamSize: seed.teamSize,
      type: seed.type,
      showInBlog: seed.type === 'industrial',
      supervisor: supervisor._id,
      status: 'open',
    })

    if (project.type === 'industrial') {
      await BlogPost.create({
        title: project.title,
        content: project.description,
        author: supervisor._id,
        tag: 'News',
        isIndustrialShowcase: true,
        linkedProject: project._id,
        likes: 0,
        likedBy: [],
        comments: [],
      })
    }

    createdCount += 1
  }

  console.log(`Seeded projects: created=${createdCount}, skipped(existing)=${skippedCount}`)

  await mongoose.disconnect()
}

main().catch(async (err) => {
  console.error('Seed failed:', err?.message || err)
  try {
    await mongoose.disconnect()
  } catch {
    // ignore
  }
  process.exit(1)
})
