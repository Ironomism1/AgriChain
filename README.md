# AgriChain

> Blockchain-based agricultural marketplace with real-time chat, escrow payments, and ML crop predictions

## Overview

AgriChain is a comprehensive platform connecting farmers, traders, and consumers with:
- **Real-time Chat** - Instant communication between buyers and sellers
- **Smart Escrow** - Secure transactions using Razorpay and blockchain
- **Crop Predictions** - ML-powered yield and price forecasting
- **Farm Listings** - Browse and manage agricultural products
- **User Reviews** - Build trust through ratings and feedback

## Tech Stack

### Frontend
- React 17+ with Socket.IO for real-time updates
- Tailwind CSS for styling
- Deployed on Vercel

### Backend
- Node.js/Express with MongoDB
- Socket.IO for WebSockets
- JWT authentication
- Razorpay payment integration
- Deployed on Render

### ML Services
- Python with TensorFlow/Scikit-learn
- Crop yield prediction
- Price forecasting
- District-specific models

## Project Structure

```
agrichain/
├── unified-backend/          # Node.js backend (Render)
│   ├── routes/              # API endpoints
│   ├── models/              # MongoDB schemas
│   ├── middleware/          # Auth & utilities
│   └── server.js            # Express app
├── AgriChain/
│   └── Frontend/            # React app (Vercel)
│       ├── src/
│       ├── public/
│       └── package.json
├── AgriPredict/             # Python ML models
│   ├── *.py                 # Model scripts
│   └── venv/               # Python environment
├── docs/                    # Documentation
│   ├── guides/             # User guides
│   ├── api/                # API documentation
│   └── deployment/         # Deployment guides
└── scripts/                 # Helper scripts
```

## Quick Start

### Prerequisites
- Node.js 16+
- Python 3.8+
- MongoDB (local or Atlas)
- Git

### Local Development

1. **Clone repository**
   ```bash
   git clone https://github.com/Ironomism1/AgriChain.git
   cd AgriChain
   ```

2. **Backend setup**
   ```bash
   cd unified-backend
   npm install
   cp .env.example .env
   # Edit .env with your MongoDB URI
   npm start
   ```

3. **Frontend setup**
   ```bash
   cd AgriChain/Frontend
   npm install
   npm start
   # Opens at http://localhost:3000
   ```

4. **ML Services**
   ```bash
   cd AgriPredict
   python -m venv venv
   venv\Scripts\activate  # Windows
   pip install -r requirements.txt
   python demo_service.py
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get user profile

### Chat
- `GET /api/chat/conversations` - List conversations
- `GET /api/chat/messages/:id` - Get messages
- `POST /api/chat/messages` - Send message (WebSocket)

### Listings
- `GET /api/listings` - Browse products
- `POST /api/listings` - Create listing
- `GET /api/listings/:id` - Product details

### Contracts
- `GET /api/contracts` - List contracts
- `POST /api/contracts` - Create contract
- `PUT /api/contracts/:id` - Update contract

### Escrow
- `GET /api/escrow` - Transaction history
- `POST /api/escrow/initiate` - Start transaction
- `PUT /api/escrow/:id/complete` - Complete transaction

### Payments
- `POST /api/payments/razorpay/create` - Create payment
- `POST /api/payments/razorpay/verify` - Verify payment

## Deployment

### Deploy Backend on Render
1. Go to [render.com](https://render.com)
2. Create Web Service from GitHub repo
3. Root directory: `unified-backend`
4. Environment variables:
   ```
   MONGO_URI=mongodb+srv://...
   JWT_SECRET=your-secret-key
   PORT=8000
   ```

### Deploy Frontend on Vercel
1. Go to [vercel.com](https://vercel.com)
2. Import GitHub repo
3. Root directory: `AgriChain/Frontend`
4. Environment variables:
   ```
   REACT_APP_API_URL=https://your-render-backend.onrender.com
   ```

See [docs/deployment/](docs/deployment/) for detailed guides.

## Features

### Chat System
- Real-time bidirectional communication
- Message history
- Typing indicators
- Online status

### Escrow Transactions
- Secure payment holding
- Milestone-based release
- Dispute resolution
- Transaction history

### ML Predictions
- Yield forecasting
- Price predictions
- District-specific models
- Historical data analysis

### User System
- Role-based access (Farmer, Trader, Admin)
- Profile management
- Reputation scoring
- KYC verification

## Testing

```bash
# Run backend tests
cd unified-backend
npm test

# Run frontend tests
cd AgriChain/Frontend
npm test

# Load testing
npm run load-test
```

## Documentation

- [User Guide](docs/guides/QUICK_START_USAGE.md)
- [API Documentation](docs/api/)
- [Deployment Guide](docs/deployment/DEPLOYMENT_GUIDE.md)
- [Architecture Overview](docs/SYSTEM_ARCHITECTURE.md)

## Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## License

This project is open source and available under the MIT License.

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Email: support@agrichain.dev
- Visit our [documentation](docs/)

## Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced ML models
- [ ] Smart contracts integration
- [ ] Payment gateway expansion
- [ ] Multi-language support
- [ ] Offline mode

---

**Status:** Production Ready | **Last Updated:** November 2025
