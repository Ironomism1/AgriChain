const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✓ Connected to MongoDB');
  } catch (error) {
    console.error('✗ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Connect to database
connectDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/farm', require('./routes/farm'));
app.use('/api/listings', require('./routes/listings'));
app.use('/api/contracts', require('./routes/contracts'));
app.use('/api/contracts-payment', require('./routes/contracts-with-payments'));
app.use('/api/predictions', require('./routes/predictions'));
app.use('/api/recommendations', require('./routes/recommendations'));
app.use('/api/market', require('./routes/market'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/escrow', require('./routes/escrow'));
app.use('/api/payments', require('./routes/razorpay-payment'));
app.use('/api/kyc', require('./routes/kyc'));
app.use('/api/preferences', require('./routes/preferences'));
app.use('/api/payment-requests', require('./routes/paymentRequests'));
app.use('/api/chat', require('./routes/chat'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'Server running',
    timestamp: new Date(),
    version: '1.0.0'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    status: err.status || 500
  });
});

// WebSocket connection for real-time features
io.on('connection', (socket) => {
  console.log(`✓ User connected: ${socket.id}`);

  // Join user-specific room for notifications and chat
  socket.on('join-user', (userId) => {
    socket.join(`user-${userId}`);
    socket.join(`chat-user-${userId}`);
    console.log(`User ${userId} joined notification and chat room`);
  });

  // Chat: Join conversation room
  socket.on('join-chat', (data) => {
    const { conversationId, userId } = data;
    socket.join(`chat-${conversationId}`);
    console.log(`User ${userId} joined chat room: ${conversationId}`);
    
    // Notify others that user is typing
    socket.broadcast.to(`chat-${conversationId}`).emit('user-joined-chat', {
      userId,
      timestamp: new Date()
    });
  });

  // Chat: Send message in real-time
  socket.on('send-chat-message', (data) => {
    const { conversationId, message, userId, userName, userPhone } = data;
    
    // Broadcast message to all users in the conversation
    io.to(`chat-${conversationId}`).emit('receive-chat-message', {
      conversationId,
      message: {
        senderId: userId,
        senderName: userName,
        senderPhone: userPhone,
        content: message.content,
        timestamp: new Date(),
        isRead: false,
        isImportant: false
      }
    });
  });

  // Chat: User typing indicator
  socket.on('user-typing', (data) => {
    const { conversationId, userId, userName, isTyping } = data;
    socket.broadcast.to(`chat-${conversationId}`).emit('user-typing-status', {
      conversationId,
      userId,
      userName,
      isTyping
    });
  });

  // Chat: Mark message as important
  socket.on('mark-important', (data) => {
    const { conversationId, messageIndex, userId, userName } = data;
    
    // Broadcast to all in conversation
    io.to(`chat-${conversationId}`).emit('message-marked-important', {
      conversationId,
      messageIndex,
      userId,
      userName,
      timestamp: new Date()
    });

    // Also send notification to other participants
    io.to(`user-${userId}`).emit('important-message-notification', {
      type: 'important_message',
      message: `Message marked as important in conversation`,
      conversationId,
      messageIndex
    });
  });

  // Chat: Receive message read receipt
  socket.on('message-read', (data) => {
    const { conversationId, userId } = data;
    socket.broadcast.to(`chat-${conversationId}`).emit('message-read-receipt', {
      conversationId,
      userId,
      timestamp: new Date()
    });
  });

  // Real-time message for contract negotiations
  socket.on('send-message', (data) => {
    const { contractId, senderId, recipientId, message } = data;
    io.to(`user-${recipientId}`).emit('receive-message', {
      contractId,
      senderId,
      message,
      timestamp: new Date()
    });
  });

  // Price alert subscription
  socket.on('subscribe-price-alert', (crop) => {
    socket.join(`price-alert-${crop}`);
    console.log(`User subscribed to price alerts for ${crop}`);
  });

  // Contract status update
  socket.on('contract-status-update', (data) => {
    const { contractId, newStatus, recipientId } = data;
    io.to(`user-${recipientId}`).emit('contract-updated', {
      contractId,
      newStatus,
      timestamp: new Date()
    });
  });

  socket.on('disconnect', () => {
    console.log(`✗ User disconnected: ${socket.id}`);
  });
});

// Make io accessible to route handlers
app.set('io', io);

// Start server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║  AgriChain Unified Backend Server Started  ║
╚════════════════════════════════════════════╝
Port: ${PORT}
Environment: ${process.env.NODE_ENV || 'development'}
Database: Connected
Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}
AgriPredict Service: ${process.env.AGRIPREDICT_SERVICE_URL || 'http://localhost:5000'}
  `);
});

module.exports = { app, server, io };
