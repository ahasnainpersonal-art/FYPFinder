const Project = require('../models/Project')
const BlogPost = require('../models/BlogPost')

// api to browse projects 
//get api/projects
const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ status: 'open' }).populate('supervisor', 'name email')
    res.json(projects)
  } catch (err) {
    res.status(500).json({ message: 'Failed to load projects', error: err?.message || 'Unknown error' })
  }
}

// GET /api/projects/:id — single project
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('supervisor', 'name email')
    if (!project) return res.status(404).json({ message: 'Project not found' })
    res.json(project)
  } catch (err) {
    res.status(500).json({ message: 'Failed to load project', error: err?.message || 'Unknown error' })
  }
}

// POST /api/projects — supervisor only
const createProject = async (req, res) => {
  try {
    const { title, description, domain, teamSize, type } = req.body

    const project = await Project.create({
      title,
      description,
      domain,
      teamSize,
      type: type || 'listed',
      showInBlog: type === 'industrial',
      supervisor: req.user._id,
    })

    if (project.type === 'industrial') {
      await BlogPost.create({
        title: project.title,
        content: project.description,
        author: req.user._id,
        tag: 'News',
        isIndustrialShowcase: true,
        linkedProject: project._id,
        likes: 0,
        likedBy: [],
        comments: [],
      })
    }

    res.status(201).json(project)
  } catch (err) {
    res.status(500).json({ message: 'Failed to create project', error: err?.message || 'Unknown error' })
  }
}

// PUT /api/projects/:id — supervisor only, their own project
const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
    if (!project) return res.status(404).json({ message: 'Project not found' })

    if (project.supervisor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not your project' })
    }

    const { title, description, domain, teamSize, status, showInBlog } = req.body
    project.title = title || project.title
    project.description = description || project.description
    project.domain = domain || project.domain
    project.teamSize = teamSize || project.teamSize
    project.status = status || project.status
    if (typeof showInBlog === 'boolean') {
      project.showInBlog = showInBlog
    }

    const updated = await project.save()
    res.json(updated)
  } catch (err) {
    res.status(500).json({ message: 'Failed to update project', error: err?.message || 'Unknown error' })
  }
}

// DELETE /api/projects/:id — supervisor only
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
    if (!project) return res.status(404).json({ message: 'Project not found' })

    if (project.supervisor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not your project' })
    }

    await project.deleteOne()
    res.json({ message: 'Project deleted' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete project', error: err?.message || 'Unknown error' })
  }
}

// GET /api/projects/mine — supervisor sees their own projects
const getMyProjects = async (req, res) => {
  try {
    const projects = await Project.find({ supervisor: req.user._id })
    res.json(projects)
  } catch (err) {
    res.status(500).json({ message: 'Failed to load your projects', error: err?.message || 'Unknown error' })
  }
}

module.exports = { getProjects, getProjectById, createProject, updateProject, deleteProject, getMyProjects }