const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ConversationSchema = new Schema({
  participants: [{
    type: mongoose.Types.ObjectId,
    ref: 'User'
  }],
  messages: [{
    _id: String,
    content: String,
    sender: {
      _id: String,
      name: String
    },
    sendAt: {
      type: Date,
      default: Date.now
    }
  }],
}, {
  timestamps: true
})

module.exports = mongoose.model('Conversation', ConversationSchema)