# GitHub & Cloud Deployment Steps

**Status:** Git commit complete (89491c3). Ready to push to GitHub.

## Step 1: Create GitHub Repository

1. Go to [https://github.com/new](https://github.com/new)
2. Enter repository name: `agrichain` or `agrichain-platform`
3. Description: "AgriChain - Blockchain-based agricultural marketplace with real-time chat, escrow payments, and ML predictions"
4. Select: **Public** (for Render/Vercel auto-deployment)
5. Click "Create repository"
6. **Copy** the repository URL (will be like: `https://github.com/YOUR_USERNAME/agrichain.git`)

## Step 2: Push to GitHub

Replace `YOUR_USERNAME` with your actual GitHub username, then run:

```powershell
cd "c:\Users\Shriyansh Mishra\Documents\Codes\Projects\P"

# Add GitHub as remote
git remote add origin https://github.com/YOUR_USERNAME/agrichain.git

# Rename default branch to main (optional, GitHub now uses 'main' by default)
git branch -M main

# Push all commits and set tracking
git push -u origin main
```

**Output should show:**
```
Enumerating objects: 3000+
Counting objects: 100%
Compressing objects: 100%
Writing objects: 100%
remote: Storing the repository...
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

Verify: `https://github.com/YOUR_USERNAME/agrichain`

## Step 3: Deploy Backend on Render

### 3A: Create Render Account
1. Go to [https://render.com](https://render.com)
2. Sign up/Sign in with GitHub
3. Authorize Render to access your GitHub account

### 3B: Create New Web Service
1. Click "New +" → "Web Service"
2. Select repository: `agrichain`
3. Click "Connect"

### 3C: Configure Deployment
```
Service Details:
- Name: agrichain-backend
- Environment: Node
- Region: Pick closest to you (or default)
- Branch: main
- Root Directory: unified-backend
- Build Command: npm install
- Start Command: npm start
```

### 3D: Add Environment Variables
Click "Environment" and add:

```
MONGO_URI = mongodb+srv://YOUR_MONGO_USER:YOUR_MONGO_PASSWORD@cluster0.mongodb.net/agrichain?retryWrites=true&w=majority

JWT_SECRET = your-secret-key-here-min-32-chars-recommended

PORT = 8000

NODE_ENV = production

RAZORPAY_KEY_ID = (leave empty for now, add later if needed)

RAZORPAY_KEY_SECRET = (leave empty for now, add later if needed)

SOCKET_IO_CORS = *
```

**Note:** To get `MONGO_URI`:
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Get connection string: `mongodb+srv://username:password@cluster0.mongodb.net/agrichain`

### 3E: Deploy
- Click "Create Web Service"
- Render will build and deploy automatically
- **Wait 2-3 minutes for deployment**
- Once deployed, get your URL: `https://agrichain-backend-xxxx.onrender.com`
- Copy this URL for Step 4

## Step 4: Deploy Frontend on Vercel

### 4A: Create Vercel Account
1. Go to [https://vercel.com](https://vercel.com)
2. Sign up/Sign in with GitHub
3. Authorize Vercel to access your repositories

### 4B: Import GitHub Repository
1. Click "Add New" → "Project"
2. Select repository: `agrichain`
3. Click "Import"

### 4C: Configure Build Settings
```
Project Settings:
- Framework Preset: Create React App
- Root Directory: AgriChain/Frontend (IMPORTANT!)
- Build Command: npm run build
- Output Directory: build
- Environment Variables:
```

### 4D: Add Environment Variables
In Vercel dashboard, add:
```
REACT_APP_API_URL = https://agrichain-backend-xxxx.onrender.com
```
(Use the URL from Step 3E)

### 4E: Deploy
- Click "Deploy"
- Vercel will build React app
- **Wait 2-3 minutes for deployment**
- Your frontend URL: `https://agrichain-vercel-xxxx.vercel.app` or custom domain
- **Copy this URL for testing**

## Step 5: Update Backend Environment Variables (If Needed)

Go back to Render dashboard → agrichain-backend → Environment

Add frontend URL (optional, for CORS):
```
FRONTEND_URL = https://agrichain-vercel-xxxx.vercel.app
```

Then restart the service.

## Step 6: Test Live URLs

### Test Backend Health
Open: `https://agrichain-backend-xxxx.onrender.com/api/auth/health`
Expected response: `{ status: "ok" }` or similar

### Test Frontend
Open: `https://agrichain-vercel-xxxx.vercel.app`
- See login page
- Create test account or use existing (if seeded)
- Test chat functionality
- Verify real-time updates work

### Common Issues & Fixes

**CORS Errors?**
- Backend: Check `SOCKET_IO_CORS = *`
- Restart Render service

**Blank page on Vercel?**
- Check browser console for errors
- Verify `REACT_APP_API_URL` is set correctly
- Run: `npm run build` locally to test

**Chat not connecting?**
- Backend must be running (check Render logs)
- Socket.IO needs CORS enabled
- Check frontend logs: `Network` tab in DevTools

## Step 7: Set Custom Domain (Optional)

**Render Backend:**
1. Dashboard → agrichain-backend → Settings
2. Add Custom Domain
3. Update DNS records

**Vercel Frontend:**
1. Dashboard → agrichain → Settings → Domains
2. Add domain
3. DNS configuration instructions

## Step 8: Monitor & Logs

**Render Logs:**
- Dashboard → agrichain-backend → Logs
- View real-time logs as requests come in

**Vercel Logs:**
- Dashboard → agrichain → Deployments
- Click latest deployment for build logs

## Troubleshooting Checklist

- [ ] GitHub repository created and code pushed
- [ ] Render backend deployed and running
- [ ] Vercel frontend deployed and loading
- [ ] Backend health check responds: `https://...backend.../api/auth/health`
- [ ] Frontend loads without blank pages
- [ ] Chat connects in real-time
- [ ] No CORS errors in browser console
- [ ] Transactions load with mock data
- [ ] Database connection successful (check Render logs)

## Quick Command Reference

```powershell
# Check git status
git status

# View commits
git log --oneline -5

# View remote
git remote -v

# Check which branch
git branch

# Push latest changes to GitHub
git push
```

## Next Steps After Deployment

1. Run load tests against live URLs
2. Monitor Render/Vercel dashboards for errors
3. Test all chat features on production
4. Verify transaction history displays correctly
5. Check WebSocket connections
6. Monitor database queries
7. Set up error tracking (Sentry, etc.)
8. Enable auto-scaling if needed

---

**Estimated Time:** 15-20 minutes total  
**Git Commit:** ✅ Complete  
**GitHub Push:** Ready (Step 2)  
**Total Deployment Time:** ~30 minutes (after GitHub setup)
