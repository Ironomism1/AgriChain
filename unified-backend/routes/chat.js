const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const Chat = require('../models/Chat');
const User = require('../models/User');
const Notification = require('../models/Notification');

/**
 * GET /api/chat/conversations
 * Get all chat conversations for logged-in user
 */
router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all conversations where user is a participant
    const conversations = await Chat.find({
      participantIds: userId,
      archivedBy: { $ne: userId }
    })
      .populate('participantIds', 'name phone')
      .populate('lastMessageSenderId', 'name')
      .sort({ lastMessageTime: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      conversations: conversations
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

/**
 * GET /api/chat/:conversationId
 * Get messages from a specific conversation
 */
router.get('/:conversationId', authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await Chat.findById(conversationId)
      .populate('participantIds', 'name phone')
      .populate('messages.senderId', 'name phone');

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check if user is a participant
    if (!conversation.participantIds.some(p => p._id.toString() === userId)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Mark all messages as read for this user
    conversation.messages.forEach(msg => {
      if (msg.senderId._id.toString() !== userId) {
        msg.isRead = true;
      }
    });
    await conversation.save();

    // Reset unread count
    conversation.unreadCount.set(userId, 0);
    await conversation.save();

    res.status(200).json({
      success: true,
      conversation: conversation
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

/**
 * POST /api/chat/send
 * Send a message in a conversation
 */
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { conversationId, recipientId, content } = req.body;
    const senderId = req.user.id;
    const senderName = req.user.name;
    const senderPhone = req.user.phone;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    let conversation;

    if (conversationId) {
      // Send to existing conversation
      conversation = await Chat.findById(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
    } else if (recipientId) {
      // Create new conversation if it doesn't exist
      let existingChat = await Chat.findOne({
        participantIds: { $all: [senderId, recipientId] }
      });

      if (existingChat) {
        conversation = existingChat;
      } else {
        // Get recipient info
        const recipient = await User.findById(recipientId);
        if (!recipient) {
          return res.status(404).json({ error: 'Recipient not found' });
        }

        // Create new conversation
        conversation = new Chat({
          participantIds: [senderId, recipientId],
          participantNames: [senderName, recipient.name],
          messages: [],
          unreadCount: new Map([[recipientId, 0]])
        });
      }
    } else {
      return res.status(400).json({ error: 'Provide conversationId or recipientId' });
    }

    // Add message
    const newMessage = {
      senderId: senderId,
      senderName: senderName,
      senderPhone: senderPhone,
      content: content.trim(),
      timestamp: new Date(),
      isRead: false,
      isImportant: false,
      markedImportantBy: []
    };

    conversation.messages.push(newMessage);
    conversation.lastMessage = content.trim();
    conversation.lastMessageTime = new Date();
    conversation.lastMessageSenderId = senderId;

    // Update unread count for other participants
    conversation.participantIds.forEach(participantId => {
      if (participantId.toString() !== senderId) {
        const currentUnread = conversation.unreadCount.get(participantId.toString()) || 0;
        conversation.unreadCount.set(participantId.toString(), currentUnread + 1);
      }
    });

    await conversation.save();

    // Populate for response
    await conversation.populate('participantIds', 'name phone');
    await conversation.populate('messages.senderId', 'name phone');

    // Emit event to notify other participants (will be handled by Socket.IO)
    req.app.io?.emit('new_message', {
      conversationId: conversation._id,
      message: newMessage,
      participantIds: conversation.participantIds.map(p => p._id.toString())
    });

    res.status(201).json({
      success: true,
      conversation: conversation,
      message: newMessage
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

/**
 * PUT /api/chat/:conversationId/message/:messageIndex/mark-important
 * Mark a message as important
 */
router.put('/:conversationId/message/:messageIndex/mark-important', authMiddleware, async (req, res) => {
  try {
    const { conversationId, messageIndex } = req.params;
    const userId = req.user.id;

    const conversation = await Chat.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check if user is a participant
    if (!conversation.participantIds.some(p => p._id.toString() === userId)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const msgIndex = parseInt(messageIndex);
    if (msgIndex < 0 || msgIndex >= conversation.messages.length) {
      return res.status(400).json({ error: 'Invalid message index' });
    }

    const message = conversation.messages[msgIndex];

    // Toggle important status
    if (message.markedImportantBy.includes(userId)) {
      // Remove from important
      message.markedImportantBy = message.markedImportantBy.filter(
        id => id.toString() !== userId
      );
      message.isImportant = message.markedImportantBy.length > 0;
    } else {
      // Add to important
      message.markedImportantBy.push(userId);
      message.isImportant = true;

      // Create notification for important messages
      try {
        const sender = await User.findById(message.senderId);
        const marker = await User.findById(userId);

        const notification = new Notification({
          userId: message.senderId,
          type: 'important_message',
          title: 'Important Message Marked',
          message: `${marker.name} marked your message as important`,
          relatedId: conversationId,
          relatedType: 'Chat',
          data: {
            conversationId: conversationId,
            messageIndex: msgIndex,
            messageContent: message.content,
            markedBy: marker.name
          }
        });
        await notification.save();
      } catch (notifError) {
        console.error('Failed to create notification:', notifError);
        // Don't fail the request if notification fails
      }
    }

    await conversation.save();

    res.status(200).json({
      success: true,
      message: 'Message importance updated',
      isImportant: message.isImportant
    });
  } catch (error) {
    console.error('Error marking important:', error);
    res.status(500).json({ error: 'Failed to mark message' });
  }
});

/**
 * GET /api/chat/important-messages
 * Get all important messages across all conversations
 */
router.get('/important/all', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all conversations where user is a participant
    const conversations = await Chat.find({
      participantIds: userId
    })
      .populate('participantIds', 'name phone')
      .populate('messages.senderId', 'name phone');

    // Extract important messages
    const importantMessages = [];
    conversations.forEach(conv => {
      conv.messages.forEach((msg, index) => {
        if (msg.isImportant) {
          importantMessages.push({
            conversationId: conv._id,
            messageIndex: index,
            message: msg,
            otherParticipants: conv.participantIds.filter(
              p => p._id.toString() !== userId
            )
          });
        }
      });
    });

    // Sort by timestamp, newest first
    importantMessages.sort((a, b) => b.message.timestamp - a.message.timestamp);

    res.status(200).json({
      success: true,
      importantMessages: importantMessages
    });
  } catch (error) {
    console.error('Error fetching important messages:', error);
    res.status(500).json({ error: 'Failed to fetch important messages' });
  }
});

/**
 * POST /api/chat/:conversationId/archive
 * Archive a conversation
 */
router.post('/:conversationId/archive', authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await Chat.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (!conversation.archivedBy.includes(userId)) {
      conversation.archivedBy.push(userId);
      await conversation.save();
    }

    res.status(200).json({ success: true, message: 'Conversation archived' });
  } catch (error) {
    console.error('Error archiving conversation:', error);
    res.status(500).json({ error: 'Failed to archive conversation' });
  }
});

/**
 * POST /api/chat/:conversationId/mute
 * Mute a conversation
 */
router.post('/:conversationId/mute', authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await Chat.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (!conversation.mutedBy.includes(userId)) {
      conversation.mutedBy.push(userId);
      await conversation.save();
    }

    res.status(200).json({ success: true, message: 'Conversation muted' });
  } catch (error) {
    console.error('Error muting conversation:', error);
    res.status(500).json({ error: 'Failed to mute conversation' });
  }
});

module.exports = router;
