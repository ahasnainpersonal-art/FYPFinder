const Group = require('../models/Group')
const User = require('../models/User')

const normalizeEmail = (email) => String(email || '').trim().toLowerCase()

const setGroupStatus = (group) => {
  const size = Array.isArray(group.members) ? group.members.length : 0
  group.status = size >= 2 ? 'complete' : 'forming'
}

const groupPopulation = [
  { path: 'leader', select: 'name email skills cgpa github photo' },
  { path: 'members', select: 'name email skills cgpa github photo' },
]

const loadGroup = async (groupId) => {
  if (!groupId) return null
  return Group.findById(groupId).populate(groupPopulation)
}

const createGroup = async (req, res) => {
  try {
    if (req.user.group) {
      return res.status(400).json({ message: 'You are already in a group' })
    }

    const group = await Group.create({
      leader: req.user._id,
      members: [req.user._id],
      status: 'forming',
    })

    req.user.group = group._id
    await req.user.save()

    setGroupStatus(group)
    await group.save()

    const populated = await loadGroup(group._id)
    return res.status(201).json(populated)
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create group', error: err?.message || 'Unknown error' })
  }
}

const getMyGroup = async (req, res) => {
  try {
    if (!req.user.group) {
      return res.json(null)
    }

    const group = await loadGroup(req.user.group)
    if (!group) {
      req.user.group = null
      await req.user.save()
      return res.json(null)
    }

    return res.json(group)
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load group', error: err?.message || 'Unknown error' })
  }
}

const searchStudents = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim()
    if (!q || q.length < 1) {
      return res.json([])
    }

    const regex = new RegExp(q, 'i')
    const students = await User.find({
      role: 'student',
      group: null,
      _id: { $ne: req.user._id },
      $or: [{ name: regex }, { email: regex }],
    })
      .select('_id name email skills cgpa')
      .limit(5)

    return res.json(students)
  } catch (err) {
    return res.status(500).json({ message: err?.message || 'Failed to search students' })
  }
}

const inviteMember = async (req, res) => {
  try {
    console.log(req.body)
    const { email } = req.body
    const normalized = normalizeEmail(email)
    if (!normalized) {
      return res.status(400).json({ message: 'email is required' })
    }

    const group = await Group.findById(req.params.id)
    if (!group) return res.status(404).json({ message: 'Group not found' })

    if (String(group.leader) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only leader can add members' })
    }

    if (group.members.length >= 3) {
      return res.status(400).json({ message: 'Group is full, maximum 3 members allowed' })
    }

    const userToAdd = await User.findOne({ email: normalized })
    if (!userToAdd) {
      return res.status(404).json({ message: 'Student not found' })
    }
    if (userToAdd.role !== 'student') {
      return res.status(400).json({ message: 'Only students can be added to a group' })
    }

    if (String(userToAdd.group || '') === String(group._id)) {
      return res.status(400).json({ message: 'Already in your group' })
    }

    if (userToAdd.group) {
      return res.status(400).json({ message: 'This student is already in another group' })
    }

    group.members.push(userToAdd._id)
    userToAdd.group = group._id
    await userToAdd.save()
    setGroupStatus(group)
    await group.save()

    const populated = await loadGroup(group._id)

    return res.json(populated)
  } catch (err) {
    return res.status(500).json({ message: 'Failed to invite member', error: err?.message || 'Unknown error' })
  }
}

const removeMember = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
    if (!group) return res.status(404).json({ message: 'Group not found' })

    if (String(group.leader) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only leader can remove members' })
    }

    const userId = String(req.params.userId)
    if (String(group.leader) === userId) {
      return res.status(400).json({ message: 'Leader cannot remove themselves, disband the group instead' })
    }

    if (group.members.length <= 2) {
      return res.status(400).json({ message: 'Cannot remove member — group must have at least 2 members.' })
    }

    const before = group.members.length
    group.members = group.members.filter((id) => String(id) !== userId)
    if (group.members.length === before) {
      return res.status(404).json({ message: 'Member not found in group' })
    }

    const removedUser = await User.findById(userId)
    if (removedUser) {
      removedUser.group = null
      await removedUser.save()
    }

    setGroupStatus(group)
    await group.save()

    const populated = await loadGroup(group._id)

    return res.json(populated)
  } catch (err) {
    return res.status(500).json({ message: 'Failed to remove member', error: err?.message || 'Unknown error' })
  }
}

const promoteMember = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
    if (!group) return res.status(404).json({ message: 'Group not found' })

    if (String(group.leader) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only leader can promote members' })
    }

    const userId = String(req.params.userId)
    if (!group.members.some((memberId) => String(memberId) === userId)) {
      return res.status(400).json({ message: 'User is not in this group' })
    }

    group.leader = userId
    await group.save()

    const populated = await loadGroup(group._id)
    return res.json(populated)
  } catch (err) {
    return res.status(500).json({ message: 'Failed to promote member', error: err?.message || 'Unknown error' })
  }
}

const disbandGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
    if (!group) return res.status(404).json({ message: 'Group not found' })

    if (String(group.leader) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only leader can disband the group' })
    }

    await User.updateMany({ group: group._id }, { $set: { group: null } })
    await Group.deleteOne({ _id: group._id })

    return res.status(200).json({ message: 'Group disbanded' })
  } catch (err) {
    return res.status(500).json({ message: 'Failed to disband group', error: err?.message || 'Unknown error' })
  }
}

const leaveGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
    if (!group) return res.status(404).json({ message: 'Group not found' })

    if (String(group.leader) === String(req.user._id)) {
      return res.status(400).json({ message: 'Leader cannot leave, disband the group instead' })
    }

    if (group.members.length <= 2) {
      return res.status(400).json({ message: 'Cannot leave — you are the only other member. Ask the leader to disband the group.' })
    }

    const userId = String(req.user._id)
    group.members = group.members.filter((memberId) => String(memberId) !== userId)
    await group.save()

    const currentUser = await User.findById(req.user._id)
    if (currentUser) {
      currentUser.group = null
      await currentUser.save()
    }

    const populated = await loadGroup(group._id)
    return res.json(populated)
  } catch (err) {
    return res.status(500).json({ message: 'Failed to leave group', error: err?.message || 'Unknown error' })
  }
}

module.exports = {
  createGroup,
  getMyGroup,
  searchStudents,
  inviteMember,
  removeMember,
  promoteMember,
  disbandGroup,
  leaveGroup,
}
