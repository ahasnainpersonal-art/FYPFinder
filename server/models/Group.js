const mongoose = require('mongoose')

const groupSchema = new mongoose.Schema(
  {
    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    status: {
      type: String,
      enum: ['forming', 'complete'],
      default: 'forming',
    },
  },
  { timestamps: true }
)

groupSchema.path('members').validate(function (members) {
  if (!Array.isArray(members)) return false
  if (members.length < 1 || members.length > 3) return false
  const leaderId = String(this.leader)
  return members.some((m) => String(m) === leaderId)
}, 'Group must have 1-3 members including the leader')

module.exports = mongoose.model('Group', groupSchema)
