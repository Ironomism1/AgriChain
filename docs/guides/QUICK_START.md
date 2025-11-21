# 🚀 Quick Start Guide

## Prerequisites

1. **MongoDB** must be running
2. **Node.js** and **npm** installed
3. **Python** (from Windows Store) for ML services

## Starting the Application

### Step 1: Start MongoDB
Make sure MongoDB is running on your system:
```bash
# If MongoDB is installed as a service, it should already be running
# Otherwise, start it manually
mongod
```

### Step 2: Set Up Environment Variables (Optional but Recommended)

Create a `.env` file in `unified-backend/` directory:

```env
# Database
DB_URI=mongodb://localhost:27017/agrichain

# Twilio SMS (Optional - for real SMS)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE=+1234567890

# Gmail Email (Optional - for real emails)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your_app_password

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Razorpay (Optional - for real payments)
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
```

**Note:** The app will work without these, but SMS/Email features will be disabled.

### Step 3: Install Dependencies (if not already done)

**Backend:**
```bash
cd unified-backend
npm install
```

**Frontend:**
```bash
cd AgriChain/Frontend
npm install
```

### Step 4: Start Backend Server

Open a terminal and run:
```bash
cd unified-backend
npm start
```

The backend should start on **http://localhost:8000**

You should see:
```
╔════════════════════════════════════════════╗
║  AgriChain Unified Backend Server Started  ║
╚════════════════════════════════════════════╝
Port: 8000
```

### Step 5: Start Frontend Server

Open a **NEW** terminal and run:
```bash
cd AgriChain/Frontend
npm start
```

The frontend should start on **http://localhost:3000**

It will automatically open in your browser.

## Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **Health Check:** http://localhost:8000/health

## Troubleshooting

### Backend won't start:
1. Check if MongoDB is running
2. Check if port 8000 is already in use
3. Check `.env` file for correct database URI

### Frontend won't start:
1. Check if port 3000 is already in use
2. Make sure all dependencies are installed (`npm install`)
3. Check if backend is running first

### Database Connection Error:
- Make sure MongoDB is installed and running
- Check `DB_URI` in `.env` file
- Default: `mongodb://localhost:27017/agrichain`

## Features Now Working

✅ Real SMS (if Twilio configured)
✅ Real Email (if Gmail configured)
✅ Payment Requests (saves to database)
✅ Contract Creation (saves to database)
✅ Payment Portal (accessible from requests)
✅ In-App Notifications (bell icon in navbar)

---

**Happy Coding! 🎉**
