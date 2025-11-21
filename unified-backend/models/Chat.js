const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  // Conversation between two users
  participantIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  ],

  // Participant names for easy display
  participantNames: [String],

  // List of messages in this conversation
  messages: [
    {
      senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      senderName: String,
      senderPhone: String,
      content: {
        type: String,
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      isRead: {
        type: Boolean,
        default: false
      },
      isImportant: {
        type: Boolean,
        default: false
      },
      // Mark which user marked it as important
      markedImportantBy: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        }
      ]
    }
  ],

  // Last message preview for chat list
  lastMessage: String,
  lastMessageTime: Date,
  lastMessageSenderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Unread count per user
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map()
  },

  // Link to contract/listing if chat is about a specific contract
  contractId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contract'
  },
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing'
  },

  // Chat metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },

  // Muted conversations
  mutedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],

  // Archived conversations
  archivedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ]
});

// Index for faster queries
ChatSchema.index({ participantIds: 1 });
ChatSchema.index({ 'messages.isImportant': 1 });
ChatSchema.index({ lastMessageTime: -1 });
ChatSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Chat', ChatSchema);
