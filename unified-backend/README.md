# AgriChain Unified Backend

Unified backend server integrating AgriChain (Blockchain Marketplace) + AgriPredict (ML-powered crop planning).

## Project Structure

```
unified-backend/
├── config/              # Configuration (DB, JWT, etc.)
├── models/              # MongoDB schemas
├── routes/              # API endpoints
├── services/            # Business logic & external integrations
├── middleware/          # Authentication, authorization
├── workers/             # Background jobs (async processing)
├── package.json         # Dependencies
├── .env.example         # Environment variables template
└── server.js            # Main entry point
```

## Key Features

### 1. Authentication & Authorization
- JWT-based authentication
- Role-based access control (farmer, buyer, admin)
- Secure password hashing with bcryptjs

### 2. AgriPredict Integration
- **Crop Recommendations**: Based on soil parameters (N, P, K, pH, temperature, rainfall, humidity)
- **Yield & Price Predictions**: For informed crop selection and financial planning
- **Demand Forecasting**: Market demand analysis by crop and region
- **Fertilizer Recommendations**: Optimized NPK ratios for crops

### 3. AgriChain Marketplace
- **Crop Listings**: Create, browse, filter listings by crop/district/price
- **Interest Notifications**: SMS alerts via Twilio when buyers show interest
- **Smart Contract Management**: Multi-stage contract lifecycle with blockchain integration
- **Real-time Updates**: WebSocket-based notifications for new listings, price changes, contract updates

### 4. Analytics & Tracking
- **Farm Performance**: Income tracking, yield history, revenue reports
- **Market Opportunities**: Identify high-margin crops in farmer's region
- **Price Tracking**: Historical and predicted price trends

## Getting Started

### Prerequisites
- Node.js 16+
- MongoDB (local or Atlas)
- Redis (for caching and job queue)
- Environment variables configured

### Installation

```bash
# Clone the repo
git clone <repo-url>
cd unified-backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your credentials
# Database: DB_URI=mongodb+srv://...
# JWT: JWT_SECRET=your_secret_key
# Twilio: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE
# AgriPredict: AGRIPREDICT_SERVICE_URL=http://localhost:5000
```

### Running the Server

**Development Mode** (with auto-restart on file changes):
```bash
npm run dev
```

**Production Mode**:
```bash
npm start
```

Server will start on `PORT` (default: 8000) and log:
```
✓ Connected to MongoDB
Server running on port 8000
```

## API Endpoints

### Authentication
- `POST /api/auth/register` — Register farmer/buyer
- `POST /api/auth/login` — Login and get JWT token
- `POST /api/auth/refresh-token` — Refresh JWT token

### Predictions (AgriPredict Integration)
- `POST /api/predictions/recommendations` — Get crop recommendations
- `POST /api/predictions/yield-price` — Predict yield and price
- `GET /api/predictions/demand` — Get demand forecast
- `POST /api/predictions/fertilizer` — Get fertilizer recommendations
- `GET /api/predictions/market-opportunities` — Identify high-margin crops

### Marketplace
- `POST /api/listings/create` — Create crop listing (farmer only)
- `GET /api/listings/all` — Browse all active listings (paginated, filterable)
- `GET /api/listings/:listingId` — Get listing details
- `POST /api/listings/:listingId/interested` — Mark as interested (buyer only)
- `GET /api/listings/farmer/my-listings` — Get farmer's listings

### Contracts (Placeholder - to be implemented)
- `POST /api/contracts/initiate` — Initiate contract
- `GET /api/contracts/:contractId` — Get contract details

### Farm Profile (Placeholder - to be implemented)
- `POST /api/farm/profile` — Create/update farm profile
- `GET /api/farm/profile` — Get farm profile

### Analytics (Placeholder - to be implemented)
- `GET /api/analytics/farm-performance` — Get farm performance metrics
- `GET /api/analytics/income-report` — Get income report

### Admin (Placeholder - to be implemented)
- `GET /api/admin/contracts-review` — Review pending contracts (admin only)
- `GET /api/admin/users` — Manage users (admin only)

### Market & Opportunities
- `GET /api/market/prices` — Get price trends
- `GET /api/market/opportunities` — Get market opportunities

## Real-time Features (WebSocket)

### Events
- **`new-listing`**: Emitted when farmer creates a new crop listing
- **`buyer-interested`**: Emitted when buyer marks interest in a listing
- **`price-alert-{crop}`**: Emitted when crop price changes significantly
- **`contract-updated`**: Emitted when contract status changes
- **`send-message`/`receive-message`**: Real-time chat for contract negotiations

### Client Example
```javascript
const io = require('socket.io-client')('http://localhost:8000');

// Listen for new listings
io.on('new-listing', (data) => {
  console.log('New listing:', data);
});

// Send interest notification
io.emit('send-message', {
  contractId: '123',
  senderId: 'farmer-id',
  recipientId: 'buyer-id',
  message: 'Agreed to ₹35/kg'
});
```

## Environment Variables

See `.env.example` for all required variables:

```
# Core
DB_URI                      MongoDB connection string
JWT_SECRET                  Secret for JWT signing
PORT                        Server port (default: 8000)

# Twilio SMS
TWILIO_ACCOUNT_SID          Twilio account SID
TWILIO_AUTH_TOKEN           Twilio auth token
TWILIO_PHONE                Twilio phone number

# AgriPredict Integration
AGRIPREDICT_SERVICE_URL     URL to AgriPredict Flask server

# AWS S3 (file uploads)
AWS_ACCESS_KEY_ID           AWS credentials
AWS_SECRET_ACCESS_KEY
AWS_S3_BUCKET

# Frontend
FRONTEND_URL                React frontend URL (for CORS)
```

## Integration with AgriPredict

The backend calls AgriPredict APIs for ML predictions:

1. **Crop Recommendations** → Called when user submits soil parameters
2. **Yield/Price Predictions** → Used when creating listings to pre-fill expected revenue
3. **Demand Forecasting** → Helps buyers identify good opportunities
4. **Fertilizer Recommendations** → Guides quality standards in contracts

### Sample Integration Flow

```
1. Farmer logs in
2. Fills soil profile (N, P, K, pH, etc.)
3. Backend calls → AgriPredict /crop-recommendation
4. Returns top 5 crops with confidence scores
5. Farmer selects "Paddy"
6. Backend calls → AgriPredict /yield-price-prediction
7. Returns expected yield: 5000 kg, price: ₹35/kg
8. Farmer creates listing pre-filled with predicted values
9. Buyers see listing with market data
10. Contract created with quality standards from recommendations
```

## Database Schema

### User
```javascript
{
  name, email (unique), password (hashed),
  phone (unique), role, district, verified, avatar,
  createdAt, updatedAt
}
```

### Farm
```javascript
{
  farmerId (unique), farmName, district, areaAcres,
  soil profile (N, P, K, pH, temperature, humidity, rainfall),
  cropsGrownHistory: [{crop, year, area, yield, price, revenue}],
  recommendationsHistory: [{crop, confidence, predictions}],
  createdAt, updatedAt
}
```

### Listing
```javascript
{
  farmerId, crop, quantityKg, pricePerKg, qualityGrade,
  district, harvestDate, description, photos,
  interestedBuyers: [{buyerId, interestedAt}],
  status: 'active' | 'sold' | 'expired',
  createdAt, expiresAt, updatedAt
}
```

### Contract
```javascript
{
  listingId, buyerId, farmerId, crop, quantityKg, pricePerKg,
  downPaymentPercent, downPaymentAmount, downPaymentStatus,
  qualityStandards: {moisture, defectLimit, sizeGrade},
  deliveryWindow: {start, end},
  stage: 'negotiation' | 'signed' | 'escrowed' | ... | 'completed',
  stageHistory: [{stage, timestamp, updatedBy}],
  harvestProof: {photos, gps, submittedDate},
  verification: {verified, notes, passed, penalties},
  deliveryLogistics: {transporter, trackingId, dates},
  blockchain: {contractAddress, txHash, statusOnChain},
  createdAt, updatedAt, completedAt
}
```

## Next Steps

### Immediate (Week 1-2)
- [ ] Implement Farm profile endpoints
- [ ] Complete Contract lifecycle routes
- [ ] Add Analytics endpoints
- [ ] Implement Admin review dashboard

### Short-term (Week 3-4)
- [ ] Add file upload (photos → AWS S3)
- [ ] Implement Web3 contract signing
- [ ] Add email notifications
- [ ] Write unit tests

### Medium-term (Week 5-6)
- [ ] Deploy to production (Render/AWS)
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Performance monitoring (New Relic / Datadog)
- [ ] API rate limiting & security hardening

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:watch
```

## Deployment

### Using Render (Recommended)
1. Connect GitHub repo to Render
2. Set environment variables in Render dashboard
3. Deploy main branch

### Using Docker
```bash
docker build -t agrichain-backend .
docker run -p 8000:8000 agrichain-backend
```

## Support

For issues or questions, reach out to the team at dev@agrichain.com

---

**Last Updated**: November 2025
**Version**: 1.0.0
