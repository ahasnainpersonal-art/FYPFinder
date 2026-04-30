const Contact = require('../models/Contact')

// POST /api/contact
const submitContact = async (req, res) => {
  try {
    const { name, email, message } = req.body
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'name, email, and message are required' })
    }

    const saved = await Contact.create({ name, email, message })
    res.status(201).json({ message: 'Message sent successfully', id: saved._id })
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit message', error: err?.message || 'Unknown error' })
  }
}

// GET /api/contact — admin only
const getContacts = async (req, res) => {
  try {
    const items = await Contact.find().sort({ createdAt: -1 })
    res.json(items)
  } catch (err) {
    res.status(500).json({ message: 'Failed to load messages', error: err?.message || 'Unknown error' })
  }
}

module.exports = { submitContact, getContacts }
