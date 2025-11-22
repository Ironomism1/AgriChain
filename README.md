# AgriChain - Blockchain Agricultural Marketplace

> A comprehensive platform connecting farmers, traders, and consumers with real-time communication, secure escrow payments, and ML-powered crop predictions.

## 🎯 Overview

AgriChain revolutionizes agricultural commerce by providing:
- **✨ Real-time Chat** - Instant communication between buyers and sellers with Socket.IO
- **🔐 Smart Escrow** - Secure transactions using Razorpay and blockchain verification
- **🤖 Crop Predictions** - ML-powered yield forecasting and price predictions
- **🏪 Farm Listings** - Browse, create, and manage agricultural products
- **⭐ User Reviews** - Build trust through ratings and reputation system
- **📊 Analytics** - Track transactions, performance, and market trends
- **🔔 Notifications** - Real-time alerts for bids, offers, and transactions

## Quick Links

- 🌐 **Live Demo:** Coming Soon
- 📖 **Full Documentation:** [docs/](docs/)
- 🚀 **Deployment Guide:** [docs/deployment/DEPLOYMENT_GUIDE.md](docs/deployment/DEPLOYMENT_GUIDE.md)
- 🔧 **API Reference:** [docs/api/](docs/api/)
- 💬 **User Guide:** [docs/guides/QUICK_START_USAGE.md](docs/guides/QUICK_START_USAGE.md)

---

## 🛠 Tech Stack

### Frontend
- **React 17+** - Modern UI framework
- **Socket.IO Client** - Real-time bidirectional communication
- **Tailwind CSS** - Utility-first styling
- **Create React App** - Build tooling
- **Deployed on:** Vercel

### Backend
- **Node.js/Express** - Fast, scalable server
- **MongoDB** - NoSQL database
- **Socket.IO** - WebSocket server for real-time features
- **JWT** - Secure authentication
- **Razorpay** - Payment gateway integration
- **Mongoose** - MongoDB ODM
- **Deployed on:** Render

### Machine Learning
- **Python 3.8+** - ML implementation
- **TensorFlow/Scikit-learn** - ML models
- **Pandas** - Data processing
- **Features:**
  - Crop yield prediction
  - Price forecasting
  - District-specific models

### Blockchain
- **Solidity** - Smart contracts
- **Hardhat** - Development environment
- **Ethers.js** - Blockchain interaction

---

## 📁 Project Structure

```
AgriChain/
├── unified-backend/                 # Node.js Express Backend
│   ├── routes/                      # API endpoints
│   │   ├── auth.js                 # Authentication
│   │   ├── chat.js                 # Chat messages
│   │   ├── contracts.js            # Smart contracts
│   │   ├── escrow.js               # Escrow transactions
│   │   ├── listings.js             # Product listings
│   │   ├── paymentRequests.js      # Payment requests
│   │   ├── razorpay-payment.js     # Razorpay integration
│   │   └── notifications.js        # Real-time notifications
│   ├── models/                      # MongoDB schemas
│   │   ├── User.js                 # User model
│   │   ├── Chat.js                 # Chat messages
│   │   ├── Contract.js             # Contracts
│   │   ├── EscrowTransaction.js    # Escrow details
│   │   ├── Listing.js              # Farm listings
│   │   ├── PaymentRequest.js       # Payment requests
│   │   └── Notification.js         # Notifications
│   ├── middleware/                  # Express middleware
│   │   └── authMiddleware.js       # JWT verification
│   ├── config/                      # Configuration
│   │   └── db.js                   # MongoDB connection
│   ├── server.js                    # Express app & Socket.IO server
│   ├── package.json                 # Backend dependencies
│   └── .env                         # Environment variables (not in repo)
│
├── AgriChain/
│   ├── Frontend/                    # React Frontend
│   │   ├── src/
│   │   │   ├── pages/              # React pages
│   │   │   │   ├── chat.js        # Real-time chat
│   │   │   │   ├── listings.js    # Browse products
│   │   │   │   ├── contracts.js   # Manage contracts
│   │   │   │   ├── escrow.js      # Escrow transactions
│   │   │   │   ├── dashboard.js   # User dashboard
│   │   │   │   └── profile.js     # User profile
│   │   │   ├── components/         # Reusable components
│   │   │   ├── App.js             # Main app component
│   │   │   └── index.js           # React entry point
│   │   ├── public/                 # Static assets
│   │   ├── package.json            # Frontend dependencies
│   │   ├── .env                    # Frontend env (not in repo)
│   │   └── tailwind.config.js      # Tailwind configuration
│   │
│   ├── contracts/                   # Solidity smart contracts
│   │   ├── Escrow.sol              # Escrow contract
│   │   ├── Report.sol              # Report contract
│   │   └── MarketPlace.sol         # Marketplace contract
│   │
│   └── Agents/                      # AI agents (future)
│
├── AgriPredict/                     # Python ML Services
│   ├── *.py                        # Model scripts
│   ├── *.csv                       # Training datasets
│   ├── demo_service.py             # ML service demo
│   ├── venv/                       # Python virtual environment
│   └── requirements.txt            # Python dependencies
│
├── docs/                            # Documentation
│   ├── deployment/                  # Deployment guides
│   │   ├── DEPLOYMENT_GUIDE.md     # Multi-platform deployment
│   │   └── GITHUB_DEPLOYMENT_STEPS.md
│   ├── guides/                      # User & setup guides
│   │   ├── QUICK_START_USAGE.md    # Getting started
│   │   ├── QUICK_START_TESTING.md  # Testing guide
│   │   ├── CHAT_QUICK_GUIDE.md     # Chat feature
│   │   ├── RAZORPAY_SETUP_AND_TESTING_GUIDE.md
│   │   └── LOAD_TESTING_GUIDE.md
│   ├── api/                         # API documentation
│   │   ├── API_FIX_SUMMARY.md      # API endpoints
│   │   └── API documentation
│   └── README_*.md                  # Feature-specific docs
│
├── scripts/                         # Utility scripts
│   └── generate-mock-transactions.js # Mock data generation
│
├── .gitignore                       # Git ignore rules
├── package.json                     # Root dependencies
├── README.md                        # This file
└── DEPLOY_NOW.md                    # Quick deployment steps

```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 16+ ([Download](https://nodejs.org/))
- **Python** 3.8+ ([Download](https://www.python.org/))
- **MongoDB** (Local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) - free tier)
- **Git** ([Download](https://git-scm.com/))

### 1️⃣ Clone Repository

```bash
git clone https://github.com/Ironomism1/AgriChain.git
cd AgriChain
```

### 2️⃣ Backend Setup

```bash
cd unified-backend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Edit .env with your MongoDB URI and JWT secret
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/agrichain
# JWT_SECRET=your-secret-key-here

# Start backend server
npm start
```

**Backend runs at:** `http://localhost:8000`

### 3️⃣ Frontend Setup

```bash
cd ../AgriChain/Frontend

# Install dependencies
npm install

# Create .env file
echo "REACT_APP_API_URL=http://localhost:8000" > .env

# Start frontend app
npm start
```

**Frontend opens at:** `http://localhost:3000`

### 4️⃣ ML Services (Optional)

```bash
cd ../AgriPredict

# Create virtual environment
python -m venv venv

# Activate venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run demo service
python demo_service.py
```

---

## 🌐 Live Deployment

### Deploy Backend on Render

1. Go to [render.com](https://render.com)
2. Click **New Web Service**
3. Connect GitHub repository
4. Configure:
   - **Root Directory:** `unified-backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment Variables:**
     ```
     MONGO_URI=your-mongodb-uri
     JWT_SECRET=your-secret-key
     PORT=8000
     NODE_ENV=production
     ```
5. Deploy and get your backend URL

### Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import GitHub repository
3. Configure:
   - **Root Directory:** `AgriChain/Frontend`
   - **Build Command:** `npm run build`
   - **Environment Variables:**
     ```
     REACT_APP_API_URL=https://your-render-backend-url.onrender.com
     ```
4. Deploy and get your frontend URL

### Get MongoDB Atlas (Free Tier)

1. Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/agrichain`
4. Use in Render environment variables

📖 **Detailed Guide:** [docs/deployment/DEPLOYMENT_GUIDE.md](docs/deployment/DEPLOYMENT_GUIDE.md)

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `GET /api/auth/health` - API health check

### Chat (Real-time via Socket.IO)
- `GET /api/chat/conversations` - List conversations
- `GET /api/chat/messages/:id` - Get conversation messages
- `POST /api/chat/messages` - Send message (WebSocket event)
- Emits: `message_received`, `typing`, `online_status`

### Listings
- `GET /api/listings` - Browse all listings
- `POST /api/listings` - Create new listing
- `GET /api/listings/:id` - Get listing details
- `PUT /api/listings/:id` - Update listing
- `DELETE /api/listings/:id` - Delete listing

### Contracts
- `GET /api/contracts` - List user contracts
- `POST /api/contracts` - Create contract
- `PUT /api/contracts/:id` - Update contract status
- `GET /api/contracts/:id` - Contract details

### Escrow Transactions
- `GET /api/escrow` - Transaction history
- `POST /api/escrow/initiate` - Start transaction
- `PUT /api/escrow/:id/complete` - Release payment
- `PUT /api/escrow/:id/dispute` - File dispute

### Payments (Razorpay)
- `POST /api/payments/razorpay/create` - Create payment order
- `POST /api/payments/razorpay/verify` - Verify payment
- `GET /api/payments/history` - Payment history

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read
- Socket.IO: `notification_received` event

📖 **Full API Docs:** [docs/api/](docs/api/)

---

## 💬 Features in Detail

### 🗨️ Real-Time Chat
- Bidirectional Socket.IO communication
- Message history persistence
- Typing indicators
- Online/offline status
- User presence detection

### 🔐 Escrow System
- Secure payment holding
- Milestone-based release
- Dispute resolution
- Transaction verification
- Refund capability

### 📊 ML Predictions
- Crop yield forecasting
- Price prediction
- District-specific models
- Historical data analysis
- Trend analysis

### 👥 User System
- Role-based access (Farmer, Trader, Admin)
- Profile management
- Reputation scoring
- KYC verification
- Performance tracking

---

## 🧪 Testing

### Test Backend

```bash
cd unified-backend

# Generate mock data
npm run generate-mock

# Run tests (when available)
npm test
```

### Test Frontend

```bash
cd AgriChain/Frontend

# Run tests
npm test

# Build for production
npm run build
```

### Load Testing

```bash
# Using K6 (install: https://k6.io/)
k6 run load-test-k6.js --vus 10 --duration 30s
```

📖 **Testing Guide:** [docs/guides/QUICK_START_TESTING.md](docs/guides/QUICK_START_TESTING.md)

---

## 🔒 Security

- ✅ JWT authentication on all protected routes
- ✅ Password hashing with bcryptjs
- ✅ Environment variables for sensitive data
- ✅ CORS protection
- ✅ Input validation & sanitization
- ✅ MongoDB connection security
- ✅ Razorpay API key protection

**Never commit `.env` files!** Use `.env.example` as template.

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [DEPLOYMENT_GUIDE.md](docs/deployment/DEPLOYMENT_GUIDE.md) | Deploy to 5+ platforms |
| [QUICK_START_USAGE.md](docs/guides/QUICK_START_USAGE.md) | How to use the app |
| [QUICK_START_TESTING.md](docs/guides/QUICK_START_TESTING.md) | Testing procedures |
| [CHAT_QUICK_GUIDE.md](docs/guides/CHAT_QUICK_GUIDE.md) | Chat feature guide |
| [RAZORPAY_SETUP_AND_TESTING_GUIDE.md](docs/guides/RAZORPAY_SETUP_AND_TESTING_GUIDE.md) | Payment setup |
| [LOAD_TESTING_GUIDE.md](docs/guides/LOAD_TESTING_GUIDE.md) | Performance testing |

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** Pull Request

---

## 🐛 Troubleshooting

### Backend Won't Start
```bash
# Clear node_modules and reinstall
rm -r node_modules
npm install
npm start
```

### MongoDB Connection Failed
- Check `MONGO_URI` in `.env`
- Ensure MongoDB is running (local) or check Atlas connection
- Verify IP whitelist in MongoDB Atlas

### Frontend Blank Page
- Check browser console for errors
- Verify `REACT_APP_API_URL` environment variable
- Clear cache: `npm cache clean --force`
- Rebuild: `npm run build`

### Chat Not Connecting
- Ensure backend is running (`npm start` in unified-backend)
- Check Socket.IO CORS settings
- Verify frontend and backend can communicate

### Port Already in Use
```bash
# Find process on port 8000 (backend)
lsof -i :8000
# or Windows:
netstat -ano | findstr :8000

# Kill process (get PID first)
kill -9 <PID>
```

---

## 📊 Project Statistics

- **Backend:** 18+ API routes
- **Frontend:** 10+ React components
- **Database:** 12 MongoDB collections
- **Real-time Events:** 15+ Socket.IO events
- **ML Models:** 4 prediction models
- **Smart Contracts:** 3 contracts
- **Documentation:** 30+ guides

---

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced ML models
- [ ] Enhanced smart contracts
- [ ] Multiple payment gateways
- [ ] Multi-language support
- [ ] Offline mode
- [ ] Video chat integration
- [ ] Marketplace search filters
- [ ] Advanced analytics dashboard
- [ ] API rate limiting

---

## 📝 License

This project is open source and available under the **MIT License**.

---

## 💬 Support & Contact

- 📧 **Email:** support@agrichain.dev
- 🐛 **Issues:** [GitHub Issues](https://github.com/Ironomism1/AgriChain/issues)
- 📖 **Documentation:** [docs/](docs/)
- 🌐 **Website:** Coming Soon

---

## 👨‍💻 Authors

**Developed by:** AgriChain Development Team  
**Last Updated:** November 2025  
**Status:** Production Ready ✅

---

**⭐ Star this repository if you find it helpful!**

**Share your feedback and suggestions!**
