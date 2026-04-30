const mongoose = require('mongoose')

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: false })

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  tag: {
    type: String,
    enum: ['Tips', 'Experience', 'Announcement', 'News'],
    default: 'Tips'
  },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isIndustrialShowcase: { type: Boolean, default: false },
  linkedProject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null,
  },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [commentSchema]
}, { timestamps: true })

module.exports = mongoose.model('BlogPost', blogSchema)