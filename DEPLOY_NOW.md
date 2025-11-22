# Deploy AgriChain - Live Instructions

Your code is now on GitHub at: https://github.com/Ironomism1/AgriChain

## Step 1: Deploy Backend on Render (5 minutes)

1. Go to https://render.com/dashboard
2. Click **New ➜ Web Service**
3. Select repository: **AgriChain**
4. Configure:
   - **Name:** agrichain-backend
   - **Environment:** Node
   - **Region:** Default (or closest to you)
   - **Branch:** main
   - **Root Directory:** `unified-backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

5. Click **Advanced** and add Environment Variables:
   ```
   MONGO_URI = mongodb+srv://username:password@cluster.mongodb.net/agrichain
   JWT_SECRET = your-super-secret-key-min-32-chars
   PORT = 8000
   NODE_ENV = production
   ```

6. Click **Create Web Service**
7. Wait 2-3 minutes for deployment
8. Copy the URL when ready: `https://agrichain-backend-xxxx.onrender.com`

## Step 2: Deploy Frontend on Vercel (5 minutes)

1. Go to https://vercel.com/dashboard
2. Click **Add New ➜ Project**
3. Select repository: **AgriChain**
4. Configure:
   - **Framework Preset:** Create React App
   - **Root Directory:** `AgriChain/Frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`

5. Add Environment Variables:
   ```
   REACT_APP_API_URL = https://agrichain-backend-xxxx.onrender.com
   ```
   (Use the Render backend URL from Step 1)

6. Click **Deploy**
7. Wait 2-3 minutes for build
8. Your frontend URL: `https://agrichain.vercel.app`

## Step 3: Test Live URLs

1. **Backend Health Check:**
   ```
   https://agrichain-backend-xxxx.onrender.com/api/auth/health
   ```
   Should return: `{ status: "ok" }` or similar

2. **Frontend:**
   ```
   https://agrichain.vercel.app
   ```
   Should show login page

3. **Test Chat:**
   - Create account
   - Go to chat section
   - Verify real-time messaging works

## MongoDB Connection (Free Tier)

If you don't have MongoDB Atlas:

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up (free)
3. Create cluster (free tier)
4. Get connection string:
   ```
   mongodb+srv://username:password@cluster0.mongodb.net/agrichain?retryWrites=true&w=majority
   ```
5. Use this in Render environment variables

## Quick Status

- **GitHub:** ✅ Pushed (https://github.com/Ironomism1/AgriChain)
- **Backend:** Awaiting Render deployment
- **Frontend:** Awaiting Vercel deployment
- **Database:** Need MongoDB connection string

---

**Next:** Follow Steps 1-2 above and your app will be live!
