# AGRICHAIN + AGRIPREDICT PLATFORM
## Functioning and Workflow Overview

---

## 1. SYSTEM ARCHITECTURE OVERVIEW

The platform is a comprehensive agricultural technology ecosystem consisting of:

### A) AGRIPREDICT MODULE
- ML-powered predictive engine for crop planning and optimization
- Runs on Flask backend with Python ML models
- Helps farmers make data-driven decisions

### B) AGRICHAIN MODULE
- Blockchain-based marketplace connecting farmers and buyers
- Real-time communication system
- Smart contract management for secure transactions
- Escrow payment system for buyer protection

### C) UNIFIED BACKEND
- Node.js/Express API server
- MongoDB database for storing all data
- Socket.IO for real-time messaging
- JWT authentication for secure access

### D) FRONTEND (REACT)
- Modern responsive UI for both farmers and buyers
- Real-time chat interface
- Marketplace browsing and listing management
- Wallet integration for blockchain

---

## 2. USER ROLES & AUTHENTICATION WORKFLOW

### USER TYPES:
- **FARMER**: Creates crop listings, receives buyer inquiries, executes contracts
- **BUYER**: Browses listings, connects with farmers, negotiates contracts
- **ADMIN**: Oversees all contracts, verifies compliance, manages disputes

### AUTHENTICATION FLOW:
1. User visits login page (/login)
2. Enters email and password
3. Backend validates credentials against MongoDB User collection
4. Password verified using bcryptjs hashing
5. JWT token generated and stored in localStorage
6. Token includes: userId, role, email, name
7. All subsequent API calls include token in Authorization header
8. Token verified by JWT middleware on backend
9. User redirected to role-specific dashboard

---

## 3. AGRIPREDICT WORKFLOW (Planning Phase)

### STEP 1: CROP REGISTRATION
- **Input**: Farmer enters district and crop type
- **Action**: Registration stored in system
- **Output**: Confirmation and tracking enrollment

### STEP 2: SOIL ANALYSIS & CROP RECOMMENDATION
- **Input**: Farmer enters soil parameters
  - Nitrogen (N) level (kg/hectare)
  - Phosphorus (P) level (kg/hectare)
  - Potassium (K) level (kg/hectare)
  - pH value
  - Temperature (°C)
  - Humidity (%)
  - Rainfall (mm)
- **Process**: Decision Tree ML model analyzes soil profile
- **Output**: Top 3 recommended crops with suitability scores
- **Use Case**: Farmer selects best crop for their land conditions

### STEP 3: DEMAND PREDICTION
- **Input**: Farmer selects a crop
- **Process**: Analytics engine checks historical demand + current registrations
- **Output**: Demand forecast (High/Medium/Low) with bar chart; Number of other farmers growing same crop
- **Use Case**: Farmer assesses market competition and viability

### STEP 4: YIELD & PRICE PREDICTION
- **Input**: District, Crop type, Planned cultivation area (acres)
- **Process**: Linear Regression models using district-level historical data
- **Output**: 
  - Expected yield in quintals/kg per acre
  - Market price prediction (per kg/quintal)
  - Total expected revenue
- **Use Case**: Farmer does financial planning and sets revenue targets

### STEP 5: FERTILIZER RECOMMENDATION
- **Input**: Crop type, soil NPK values, temperature, humidity, moisture
- **Process**: Specialized ML model for nutrient optimization
- **Output**: Optimal fertilizer blend (NPK ratios) and application schedule
- **Use Case**: Farmer optimizes yields while minimizing fertilizer costs

---

## 4. AGRICHAIN MARKETPLACE WORKFLOW (Listing Phase)

### STEP 1: CREATE LISTING
Farmer inputs:
- Crop type (informed by AgriPredict recommendation)
- Variety/Grade
- Quantity (informed by yield prediction)
- Expected price (informed by price prediction)
- Quality specifications (moisture %, defects allowed)
- Location (district, latitude/longitude)
- Contact information
- Expected harvest date
- Available for contract: Yes/No

System stores in MongoDB Listing collection:
- Status: "Active"
- Created timestamp
- Farmer reference (_id)
- Images (if uploaded)

Output: Listing published to marketplace, visible to all buyers

### STEP 2: BUYER BROWSING & FILTERING
Buyer actions:
- Browse crop listings with filters: Crop type, Price range, Quantity, Location/District, Quality grade, Harvest date
- View farmer profile (reviews, previous contracts)
- Compare multiple listings with price trends

### STEP 3: BUYER INTEREST NOTIFICATION
1. Buyer clicks "Interested" button on listing
2. System creates notification record
3. SMS sent to farmer via Twilio API
4. Shows notification on farmer's dashboard
5. Farmer receives email alert

---

## 5. REAL-TIME CHAT & COMMUNICATION WORKFLOW

### TECHNOLOGY STACK:
- Socket.IO for real-time bidirectional communication
- MongoDB Chat collection for message persistence
- Backend Socket.IO server on port 8000
- Frontend Socket.IO client on port 3000

### CHAT INITIALIZATION:
1. User logs in, currentUser set from localStorage
2. Frontend establishes Socket.IO connection with JWT token
3. Socket authenticated via JWT middleware
4. User joins global room: socket.emit('join-user', userId)
5. User receives list of previous conversations

### START NEW CHAT:
1. Click "➕ New Chat"
2. Modal displays available users
3. Select participant to chat with
4. System creates new conversation in MongoDB Chat collection
5. Initial message sent: "Hi, I'd like to connect with you"
6. Socket.IO rooms created for real-time updates

### SEND MESSAGE:
1. User types message in input box
2. Click "Send" button
3. Message validated (not empty)
4. Message sent to backend via POST /api/chat/send
5. Backend stores in MongoDB Chat collection
6. Socket.IO broadcasts message to receiver
7. Message appears instantly on receiver's screen
8. Conversation list updated with last message preview

### MARK IMPORTANT MESSAGE:
1. User hovers over message and clicks 🔴 button
2. Frontend sends PUT request to backend
3. Backend sets message.isImportant = true
4. Socket.IO emits 'message-marked-important' event
5. Message UI updates showing ❤️ icon
6. Important messages stored separately for notifications

### TYPING INDICATOR:
1. User starts typing in message box
2. Socket.IO emits 'typing' event
3. Backend broadcasts to other participants
4. Receiver sees "[Name] is typing..." indicator
5. When user stops typing: Socket.IO emits 'typing' with isTyping: false

---

## 6. SMART CONTRACT & BLOCKCHAIN WORKFLOW

### CONTRACT CREATION:
1. Farmer + Buyer negotiate terms in chat
2. One party proposes contract with:
   - Price per unit (kg/quintal)
   - Quantity
   - Delivery window (start and end dates)
   - Quality standards (grade, moisture %, defects)
   - Payment terms (down payment %, final payment schedule, penalties)
3. Contract template shown on UI
4. Both parties review terms

### BLOCKCHAIN SUBMISSION:
1. Farmer clicks "Accept & Submit to Blockchain"
2. Browser prompts: Connect MetaMask wallet
3. User connects wallet (or Neo-compatible wallet)
4. Contract hash calculated from terms
5. Transaction prepared:
   - Smart Contract Address: 0x6471EACC40D24bC9F4BAB843560eDFEa190730c5
   - Network: Neo X Mainnet
   - Gas Token: GAS
6. User approves transaction in wallet
7. Contract submitted on-chain (immutable record)
8. Contract stored in MongoDB with blockchain hash and timestamp

### CONTRACT LIFECYCLE:
- Status Transitions: Proposed → Accepted → Active → In Progress → Completed
- **Active**: Both parties have signed, contract enforced
- **In Progress**: Delivery initiated, quality checking phase
- **Completed**: Delivery received, payment released
- **Dispute Handling**: Admin reviews, freezes escrow if needed, investigates, resolution recorded

---

## 7. PAYMENT & ESCROW WORKFLOW

### ESCROW SYSTEM:
1. Contract specifies down payment (e.g., 30% of total)
2. Buyer initiates payment via Razorpay payment gateway
3. Payment captured and held in escrow (not transferred to farmer yet)
4. Farmer receives notification: "Payment received, preparing shipment"

### DELIVERY & VERIFICATION:
1. Farmer prepares crop for delivery
2. Quality inspector verifies crop meets contract specs
3. Inspector marks as "Approved" or "Rejected"

### FINAL PAYMENT RELEASE:
**If approved:**
1. System releases escrow to farmer's account
2. Final payment (70% balance) due if terms allow
3. Buyer makes final payment via Razorpay
4. Both parties marked as completed

**If rejected:**
1. Buyer can request refund
2. Admin reviews dispute
3. Escrow returned to buyer or renegotiation initiated

### TRANSACTION RECORD:
- All transactions stored in MongoDB EscrowTransaction collection
- Blockchain hash stored for transparency
- Payment status tracked: Pending → Paid → Released → Completed

---

## 8. KEY FEATURES & DIFFERENTIATORS

### 1. DATA-DRIVEN DECISION MAKING
- AgriPredict ML models guide crop selection
- Price predictions enable fair pricing
- Yield forecasts help financial planning
- Reduces farmer risk through evidence-based recommendations

### 2. SECURE BLOCKCHAIN INTEGRATION
- Immutable contract records on Neo X Mainnet
- Cryptographic proof of agreement
- Transparent dispute resolution
- Builds trust between farmers and buyers

### 3. REAL-TIME COMMUNICATION
- Socket.IO messaging for instant farmer-buyer connection
- Important message marking for critical negotiations
- Typing indicators and read receipts
- Reduces communication delays

### 4. ESCROW PAYMENT PROTECTION
- Razorpay integration for secure payments
- Funds held until quality verification
- Automatic release on contract completion
- Dispute resolution mechanism

### 5. ROLE-BASED ACCESS CONTROL
- Farmers see listings and buyer inquiries
- Buyers browse and filter listings
- Admin oversees contracts and disputes
- Each role has specialized dashboard

### 6. NOTIFICATION SYSTEM
- SMS alerts via Twilio for urgent events
- In-app notifications for all activities
- Email digests of recent activities
- Configurable notification preferences

### 7. RATING & REPUTATION
- Users build reputation through successful contracts
- Reviews posted by counterparties
- Rating visible on profile
- Incentivizes honest dealings

---

## 9. FARMER WORKFLOW SUMMARY

### DAY 1: PLANNING (AgriPredict)
- Use crop recommendation to select best crop for soil
- Check demand forecast for market viability
- Get yield and price prediction
- Make decision: "I'll grow Paddy on 2 acres"

### DAY 2-3: MARKETPLACE (AgriChain)
- Create listing with crop details from prediction
- Set price based on market prediction
- Specify quality standards
- Publish listing on marketplace

### DAY 4-10: WAITING & NEGOTIATION
- Receive buyer interest notifications via SMS
- Start chat with interested buyer
- Negotiate price and terms in real-time chat
- Mark important messages for reference

### DAY 11-15: CONTRACT EXECUTION
- Agree on final terms
- Submit contract to blockchain
- Receive down payment (30%) in escrow
- Farmer receives notification of payment held

### DAY 16-30: CULTIVATION & DELIVERY
- Cultivate crop as planned
- Prepare for harvest and quality inspection
- Quality inspector verifies crop meets specs
- Arrange transportation to delivery point

### DAY 31: SETTLEMENT
- Delivery completed and verified
- Escrow released to farmer account
- Buyer pays final 70% balance
- Both parties leave reviews
- Contract marked "Completed" on blockchain

---

## 10. BUYER WORKFLOW SUMMARY

### STEP 1: DISCOVERY
- Browse AgriChain marketplace
- Filter by crop type, price, location
- Review AgriPredict price trends
- Compare farmer ratings and reviews

### STEP 2: EVALUATION
- Click on specific listing
- View farmer profile and past contracts
- Check quality specifications
- Compare with other similar listings

### STEP 3: INTEREST
- Click "Interested" button
- Farmer receives SMS notification
- Wait for farmer to initiate contact

### STEP 4: NEGOTIATION
- Join real-time chat with farmer
- Discuss price adjustments
- Agree on delivery schedule and quality standards
- Mark important terms for reference

### STEP 5: AGREEMENT
- Finalize contract terms
- Review contract preview
- Approve and submit to blockchain
- Down payment (30%) made via Razorpay

### STEP 6: RECEIPT & VERIFICATION
- Receive quality inspection report
- Verify crop meets specified standards
- If approved: Release payment or confirm final payment
- If rejected: Request refund or renegotiation

### STEP 7: COMPLETION
- Mark contract as received
- Leave review for farmer
- Transaction recorded on blockchain
- Both parties build reputation

---

## 11. TECHNOLOGY STACK

### FRONTEND (React):
- React 17+
- React Router for navigation
- Context API for state management
- Axios for API calls
- Socket.IO client for real-time updates
- Bootstrap 5 for UI components
- GSAP for animations
- MetaMask integration for wallet

### BACKEND (Node.js):
- Express.js for REST API
- Socket.IO for real-time messaging
- Mongoose for MongoDB ODM
- JWT for authentication
- bcryptjs for password hashing
- Multer for file uploads
- Twilio SDK for SMS notifications
- Razorpay SDK for payments
- Web3.js for blockchain interaction

### DATABASE (MongoDB):
- User collection
- Listing collection
- Chat collection
- Contract collection
- EscrowTransaction collection
- Notification collection
- Review collection

### BLOCKCHAIN:
- Smart contract: Report.sol (Solidity)
- Network: Neo X Mainnet
- Contract Address: 0x6471EACC40D24bC9F4BAB843560eDFEa190730c5
- Wallet: MetaMask or Neo-compatible

### ML ENGINE (AgriPredict - Python):
- Flask web framework
- scikit-learn for ML models
- Pandas, NumPy for data processing
- Matplotlib for visualization
- Historical dataset: 8+ districts

---

## 12. SECURITY MEASURES

### AUTHENTICATION & AUTHORIZATION:
✓ JWT tokens with expiration
✓ Password hashing with bcryptjs
✓ Role-based access control (RBAC)
✓ Protected API routes with middleware

### DATA PROTECTION:
✓ MongoDB collection-level access controls
✓ User data encrypted in transit (HTTPS)
✓ Sensitive data not logged
✓ Environment variables for secrets

### BLOCKCHAIN SECURITY:
✓ Smart contract audited before deployment
✓ Immutable contract records
✓ Cryptographic signatures
✓ Multi-signature verification for disputes

### PAYMENT SECURITY:
✓ Razorpay PCI-DSS compliant
✓ No credit card data stored on servers
✓ Escrow holds funds securely
✓ Transaction verification required

### SOCKET.IO SECURITY:
✓ JWT authentication required for connection
✓ User validation before message delivery
✓ Rate limiting to prevent spam
✓ Message encryption for sensitive data

---

## 13. API ENDPOINTS SUMMARY

### AUTHENTICATION:
- POST /api/auth/register - Create new user account
- POST /api/auth/login - User login (returns JWT token)
- GET /api/auth/profile - Get current user profile
- POST /api/auth/logout - Clear session
- GET /api/auth/all-users - Get list of available users for chat

### LISTING:
- POST /api/listings - Create new crop listing
- GET /api/listings - Browse listings with filters
- GET /api/listings/:id - View specific listing
- PUT /api/listings/:id - Update listing
- DELETE /api/listings/:id - Remove listing

### CHAT:
- GET /api/chat/conversations - Fetch user's conversation list
- GET /api/chat/:conversationId - Get all messages in conversation
- POST /api/chat/send - Send new message
- PUT /api/chat/:conversationId/:messageId/important - Mark message important
- GET /api/chat/important/all - Get all important messages

### CONTRACT:
- POST /api/contracts - Create new contract
- GET /api/contracts - List user's contracts
- GET /api/contracts/:id - View contract details
- PUT /api/contracts/:id - Update contract status
- POST /api/contracts/:id/sign - Submit to blockchain

### PAYMENT:
- POST /api/payments/create - Initialize Razorpay payment
- POST /api/payments/verify - Verify payment completion
- GET /api/escrow/:transactionId - Check escrow status

### NOTIFICATION:
- GET /api/notifications - Get user's notifications
- PUT /api/notifications/:id/read - Mark notification as read

---

## 14. REAL-TIME FEATURES (SOCKET.IO)

### CLIENT TO SERVER:
- 'join-user' - Register user as online
- 'send-chat-message' - Send message to another user
- 'join-chat' - Join conversation room
- 'typing' - Notify others user is typing
- 'mark-message-important' - Mark message as important
- 'disconnect' - User going offline

### SERVER TO CLIENT:
- 'receive-chat-message' - New message received
- 'user-typing-status' - Typing indicator status
- 'message-marked-important' - Important marker update
- 'important-message-notification' - Important message alert
- 'user-joined-chat' - User joined conversation
- 'user-left-chat' - User left conversation

---

## 15. TROUBLESHOOTING GUIDE

### Chat not loading:
- Check JWT token in localStorage
- Verify backend Socket.IO is running on 8000
- Check browser console for errors
- Clear browser cache and reload

### Messages not sending:
- Verify internet connection
- Check that currentUser is loaded
- Ensure both participants have active sessions
- Restart Socket.IO connection

### Contract not submitting:
- Connect MetaMask wallet properly
- Ensure sufficient GAS tokens for transaction
- Check network is set to Neo X Mainnet
- Verify contract terms are complete

### Payment issues:
- Check Razorpay account is active
- Verify API keys in .env file
- Ensure payment amount is valid
- Check buyer's payment method is working

### Database connection errors:
- Verify MongoDB is running
- Check connection string in .env
- Ensure username/password are correct
- Check firewall isn't blocking access

---

## 16. FUTURE ENHANCEMENTS

### PHASE 2 FEATURES:
✓ Mobile app (React Native)
✓ Video calls for farmer-buyer meetings
✓ Quality verification via AI image analysis
✓ Advanced analytics dashboard
✓ Predictive inventory management

### SCALABILITY:
✓ Load balancing for multiple API servers
✓ Microservices architecture
✓ Message queue (RabbitMQ/Kafka) for async tasks
✓ GraphQL API option

---

**Generated**: November 21, 2025  
**Platform**: AgriChain + AgriPredict Integrated Agricultural System
