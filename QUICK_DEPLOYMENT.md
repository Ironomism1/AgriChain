# Quick Deployment Guide

## Status
✅ **Deployment setup script fixed and working!**

Your system is **production-ready** for public deployment.

## 🚀 Fastest Way (20 minutes)

### Option 1: Render + Vercel (RECOMMENDED)
**Cost:** FREE forever | **Uptime:** 99.9%

#### Step 1: GitHub Push (5 min)
```powershell
cd "c:\Users\Shriyansh Mishra\Documents\Codes\Projects\P"
git init
git add .
git commit -m "AgriChain Production"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/agrichain.git
git push -u origin main
```

#### Step 2: Deploy Backend on Render (5 min)
1. Go to https://render.com
2. Sign up with GitHub
3. Click "New Web Service"
4. Select your agrichain repo
5. Set Root Directory: `unified-backend`
6. Start Command: `npm start`
7. Add Environment Variables:
   - `MONGO_URI=your_mongodb_url`
   - `JWT_SECRET=your_secret`
   - `PORT=8000`
8. Click Deploy

**Result:** `https://agrichain-backend.onrender.com`

#### Step 3: Deploy Frontend on Vercel (5 min)
1. Go to https://vercel.com
2. Sign up with GitHub
3. Click "Add New Project"
4. Select your agrichain repo
5. Set Root Directory: `AgriChain/Frontend`
6. Environment Variable:
   - `REACT_APP_API_URL=https://agrichain-backend.onrender.com`
7. Click Deploy

**Result:** `https://agrichain.vercel.app`

---

## 📝 Alternative Options

### Option 2: Ngrok (Quick Demo - 8 hour limit)
```powershell
# Terminal 1 - Backend
cd unified-backend
npm start

# Terminal 2 - Frontend
cd AgriChain/Frontend
npm start

# Terminal 3 - Expose Backend (Get token from https://ngrok.com)
ngrok config add-authtoken YOUR_TOKEN
ngrok http 8000

# Terminal 4 - Expose Frontend
ngrok http 3000
```

**Cost:** Free | **Setup:** 5 min | **Limit:** 8 hours/session

### Option 3: Railway (All-in-One)
1. Push to GitHub (same as Render)
2. Go to https://railway.app
3. Sign up with GitHub
4. Deploy from GitHub
5. Railway auto-configures everything

**Cost:** Free ($5/mo credit) | **Setup:** 15 min

---

## ✅ What's Ready for Deployment

- ✅ Full chat system (bidirectional, real-time)
- ✅ Transaction history with all DB records
- ✅ Mock transaction data (₹3.02L+)
- ✅ User authentication (JWT)
- ✅ Payment system (Razorpay integration)
- ✅ Blockchain smart contracts
- ✅ All APIs tested locally

---

## 🧪 Load Testing (After Deployment)

Once deployed, you can run load tests:

```powershell
# Install K6 (load testing tool)
choco install k6  # Windows with Chocolatey
# OR download from https://k6.io

# Create test file (k6-test.js)
# Then run against public URL
k6 run k6-test.js
```

---

## 📞 Support

For detailed deployment guide, see: `DEPLOYMENT_GUIDE.md`

For interactive setup: `powershell -File deploy-setup.ps1`

---

## 🎯 Next Steps

1. **Push to GitHub** (5 min)
2. **Deploy Backend on Render** (5 min)
3. **Deploy Frontend on Vercel** (5 min)
4. **Test live URLs** (5 min)
5. **Run load tests** (ongoing)

**Total Time: ~20 minutes to public URLs!**

---

**Your AgriChain system is production-ready! 🚀**
