# 🚀 AgriChain - Public Deployment Guide (Free)

## Option 1: Using Ngrok (Fastest - 5 minutes)
Perfect for quick testing and demo purposes.

### Step 1: Install Ngrok
```bash
# Download from https://ngrok.com/download
# Or via PowerShell
choco install ngrok  # if you have Chocolatey

# Verify installation
ngrok --version
```

### Step 2: Sign up for Free Account
1. Go to https://ngrok.com
2. Sign up (free tier includes public URLs)
3. Get your authtoken

### Step 3: Authenticate Ngrok
```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### Step 4: Run Both Servers Locally
Terminal 1 - Backend:
```bash
cd "c:\Users\Shriyansh Mishra\Documents\Codes\Projects\P\unified-backend"
npm start
# Should run on http://localhost:8000
```

Terminal 2 - Frontend:
```bash
cd "c:\Users\Shriyansh Mishra\Documents\Codes\Projects\P\AgriChain\Frontend"
npm start
# Should run on http://localhost:3000
```

### Step 5: Expose via Ngrok
Terminal 3 - Expose Backend:
```bash
ngrok http 8000
# You'll get: https://xxxx-xxxx-xxxx.ngrok.io
```

Terminal 4 - Expose Frontend:
```bash
ngrok http 3000
# You'll get: https://yyyy-yyyy-yyyy.ngrok.io
```

### Step 6: Update Frontend Environment
Edit Frontend `.env`:
```
REACT_APP_API_URL=https://xxxx-xxxx-xxxx.ngrok.io
```

Then restart frontend (or it auto-updates if configured).

**Public URL:** `https://yyyy-yyyy-yyyy.ngrok.io`

---

## Option 2: Using Render (Best Free Tier - 24/7)
Persistent free hosting with auto-deploys.

### Prerequisites:
- GitHub account (free)
- Push your code to GitHub

### Step 1: Create GitHub Repository
```bash
cd "c:\Users\Shriyansh Mishra\Documents\Codes\Projects\P"
git init
git add .
git commit -m "Initial commit - AgriChain full stack"
git remote add origin https://github.com/YOUR_USERNAME/agrichain.git
git push -u origin master
```

### Step 2: Deploy Backend on Render
1. Go to https://render.com
2. Sign up (free)
3. Click "New +" → "Web Service"
4. Connect GitHub repo
5. Configure:
   - **Name:** agrichain-backend
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Node Version:** 18
   - Add Environment Variables from `.env`:
     ```
     MONGO_URI=YOUR_MONGODB_CONNECTION
     JWT_SECRET=YOUR_SECRET
     RAZORPAY_KEY_ID=YOUR_KEY
     RAZORPAY_KEY_SECRET=YOUR_SECRET
     ```
6. Deploy! You'll get: `https://agrichain-backend.onrender.com`

### Step 3: Deploy Frontend on Render
1. Create separate build config
2. Or use Netlify (see Option 3)

### Step 4: Update API URL
Set in frontend `.env`:
```
REACT_APP_API_URL=https://agrichain-backend.onrender.com
```

---

## Option 3: Using Netlify + Render (Best Combo)

### Deploy Backend on Render (same as Option 2)

### Deploy Frontend on Netlify
1. Go to https://netlify.com
2. Sign up (free)
3. Connect GitHub
4. Select your repo
5. Configure:
   - **Build command:** `npm run build`
   - **Publish directory:** `build`
   - **Environment Variables:**
     ```
     REACT_APP_API_URL=https://agrichain-backend.onrender.com
     ```
6. Deploy!

You'll get free URL like: `https://agrichain-app.netlify.app`

---

## Option 4: Using Vercel (Easiest for React)

### Deploy Frontend
1. Go to https://vercel.com
2. Sign in with GitHub
3. Select your repo
4. Vercel auto-detects React
5. Add environment variable:
   ```
   REACT_APP_API_URL=https://agrichain-backend.onrender.com
   ```
6. Deploy in 1 click!

Auto-generated URL: `https://agrichain.vercel.app`

---

## Option 5: Using Railway (Modern & Easy)

### Prerequisites: GitHub account

### Deploy Full Stack
1. Go to https://railway.app
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub"
4. Select your repo
5. Railway auto-detects services:
   - Backend (Node.js on port 8000)
   - Frontend (React on port 3000)
6. Add MongoDB connection
7. Deploy!

You get custom domain like: `https://agrichain.railway.app`

---

## Quick Comparison Table

| Service | Free Tier | Setup Time | Uptime | Custom Domain |
|---------|-----------|-----------|--------|---------------|
| **Ngrok** | Yes (8 hrs) | 5 min | Temporary | Temporary URL |
| **Render** | Yes | 15 min | 99.9% | Free subdomain |
| **Netlify** | Yes | 10 min | 99.9% | Free subdomain |
| **Vercel** | Yes | 10 min | 99.9% | Free subdomain |
| **Railway** | Yes ($5/mo credit) | 10 min | 99.9% | Free subdomain |

---

## 🎯 RECOMMENDED SETUP (Best for Demo)

### Step 1: Deploy Backend on Render
- Deploy time: 15 minutes
- Free forever
- Gets: `https://agrichain-backend.onrender.com`

### Step 2: Deploy Frontend on Vercel
- Deploy time: 5 minutes  
- Free forever
- Gets: `https://agrichain.vercel.app`

### Step 3: Connect Both
Update `.env` in Vercel:
```
REACT_APP_API_URL=https://agrichain-backend.onrender.com
```

### Total Setup: 20 minutes
### Cost: $0
### Result: Fully public, always-on website

---

## 📝 Step-by-Step Recommended (Render + Vercel)

### 1. Prepare GitHub Repo
```bash
cd c:\Users\Shriyansh\ Mishra\Documents\Codes\Projects\P
git init
git add .
git commit -m "AgriChain - Production Ready"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/agrichain.git
git push -u origin main
```

### 2. Deploy Backend on Render
```
https://render.com
→ New Web Service
→ Connect GitHub → Select repo
→ Configure:
  Name: agrichain-backend
  Branch: main
  Build Command: npm install
  Start Command: npm start
  Root Directory: /unified-backend
→ Add Environment Variables:
  MONGO_URI=YOUR_MONGODB_URI
  JWT_SECRET=generate_random_string
  RAZORPAY_KEY_ID=YOUR_KEY
  RAZORPAY_KEY_SECRET=YOUR_SECRET
  PORT=8000
→ Deploy!
```

Backend URL: `https://agrichain-backend.onrender.com`

### 3. Update Frontend for Production
Edit `AgriChain/Frontend/.env.production`:
```
REACT_APP_API_URL=https://agrichain-backend.onrender.com
```

### 4. Deploy Frontend on Vercel
```
https://vercel.com
→ Add GitHub App
→ Import Project → Select your repo
→ Configure:
  Framework: Create React App
  Root Directory: ./AgriChain/Frontend
  Build Command: npm run build
  Environment Variables:
    REACT_APP_API_URL=https://agrichain-backend.onrender.com
→ Deploy!
```

Frontend URL: `https://agrichain.vercel.app`

---

## ✅ Final Checklist

- [ ] GitHub repo created and pushed
- [ ] Backend deployed on Render
- [ ] Frontend `.env` updated with backend URL
- [ ] Frontend deployed on Vercel
- [ ] Test login at `https://agrichain.vercel.app`
- [ ] Create test transactions
- [ ] Run load tests against public URL

---

## 🔗 Final Public URLs

**Frontend:** `https://agrichain.vercel.app`
**Backend API:** `https://agrichain-backend.onrender.com`

Share these links with anyone to access your live application! 🚀

---

## Free Custom Domain (Optional)

Want a custom domain for free?

### Use Freenom (free .tk, .ml, .ga domains)
1. Go to https://freenom.com
2. Search domain name
3. Register free (.tk)
4. Point to Vercel/Render via DNS

OR

### Use Free DNS
Cloudflare + Render/Vercel gives you DNS management + auto HTTPS.

---

## Monitoring & Logging

Once deployed:
- Render: Dashboard shows logs in real-time
- Vercel: Deployment analytics dashboard
- Both have free tier monitoring

---

## Next Steps After Deployment

1. ✅ Share public URL
2. ✅ Run load tests from public URL
3. ✅ Monitor performance
4. ✅ Setup custom domain (optional)
5. ✅ Add GitHub CI/CD auto-deploy

