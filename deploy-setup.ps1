#!/usr/bin/env pwsh

Write-Host "=== AgriChain Public Deployment Setup ===" -ForegroundColor Green
Write-Host ""

# Check if Git is installed
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
$gitInstalled = git --version 2>$null
if (-not $gitInstalled) {
    Write-Host "ERROR: Git not found. Please install from https://git-scm.com" -ForegroundColor Red
    exit 1
}
Write-Host "OK: Git found" -ForegroundColor Green

# Check Node.js
$nodeInstalled = node --version
Write-Host "OK: Node.js found: $nodeInstalled" -ForegroundColor Green

Write-Host ""
Write-Host "DEPLOYMENT OPTIONS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Ngrok (Temporary, instant)" -ForegroundColor Yellow
Write-Host "   - Quick demos, testing" -ForegroundColor Gray
Write-Host "   - Setup: 5 minutes | Cost: Free (8 hrs)" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Render + Vercel (RECOMMENDED)" -ForegroundColor Green
Write-Host "   - Production, always-on" -ForegroundColor Gray
Write-Host "   - Setup: 20 minutes | Cost: FREE forever" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Railway (Full Stack)" -ForegroundColor Yellow
Write-Host "   - Integrated deployment" -ForegroundColor Gray
Write-Host "   - Setup: 15 minutes | Cost: Free (5 dollars/mo credit)" -ForegroundColor Gray
Write-Host ""

$choice = Read-Host "Choose (1/2/3/Q)"

switch($choice) {
    "1" {
        Write-Host ""
        Write-Host "NGROK SETUP:" -ForegroundColor Green
        Write-Host "1. Download from https://ngrok.com/download" -ForegroundColor Cyan
        Write-Host "2. Sign up at https://ngrok.com" -ForegroundColor Cyan
        Write-Host "3. Get token from https://dashboard.ngrok.com/auth" -ForegroundColor Cyan
        Write-Host "4. Run: ngrok config add-authtoken YOUR_TOKEN" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "5. Open 4 PowerShell terminals:" -ForegroundColor Cyan
        Write-Host "   Terminal 1: cd unified-backend ; npm start" -ForegroundColor White
        Write-Host "   Terminal 2: cd AgriChain/Frontend ; npm start" -ForegroundColor White
        Write-Host "   Terminal 3: ngrok http 8000" -ForegroundColor White
        Write-Host "   Terminal 4: ngrok http 3000" -ForegroundColor White
        Write-Host ""
        Write-Host "6. Copy Terminal 4 URL and set as REACT_APP_API_URL" -ForegroundColor Cyan
    }
    
    "2" {
        Write-Host ""
        Write-Host "RENDER + VERCEL SETUP - 20 minutes to live!" -ForegroundColor Green
        Write-Host ""
        Write-Host "STEP 1: Push to GitHub" -ForegroundColor Cyan
        Write-Host "   git init" -ForegroundColor Gray
        Write-Host "   git add ." -ForegroundColor Gray
        Write-Host "   git commit -m 'AgriChain Production'" -ForegroundColor Gray
        Write-Host "   git branch -M main" -ForegroundColor Gray
        Write-Host "   git remote add origin https://github.com/YOUR_USERNAME/agrichain.git" -ForegroundColor Gray
        Write-Host "   git push -u origin main" -ForegroundColor Gray
        Write-Host ""
        Write-Host "STEP 2: Deploy Backend on Render (5 min)" -ForegroundColor Cyan
        Write-Host "   1. Go to https://render.com" -ForegroundColor Gray
        Write-Host "   2. Sign up with GitHub" -ForegroundColor Gray
        Write-Host "   3. New Web Service" -ForegroundColor Gray
        Write-Host "   4. Root Dir: unified-backend" -ForegroundColor Gray
        Write-Host "   5. Start Cmd: npm start" -ForegroundColor Gray
        Write-Host "   6. Add env: MONGO_URI, JWT_SECRET, PORT=8000" -ForegroundColor Gray
        Write-Host "   7. Deploy!" -ForegroundColor Gray
        Write-Host "   URL: https://agrichain-backend.onrender.com" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "STEP 3: Deploy Frontend on Vercel (5 min)" -ForegroundColor Cyan
        Write-Host "   1. Go to https://vercel.com" -ForegroundColor Gray
        Write-Host "   2. Sign up with GitHub" -ForegroundColor Gray
        Write-Host "   3. Import repo" -ForegroundColor Gray
        Write-Host "   4. Root Dir: AgriChain/Frontend" -ForegroundColor Gray
        Write-Host "   5. Env: REACT_APP_API_URL=https://agrichain-backend.onrender.com" -ForegroundColor Gray
        Write-Host "   6. Deploy!" -ForegroundColor Gray
        Write-Host "   URL: https://agrichain.vercel.app" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "RESULT:" -ForegroundColor Green
        Write-Host "   Frontend: https://agrichain.vercel.app" -ForegroundColor Yellow
        Write-Host "   Backend: https://agrichain-backend.onrender.com" -ForegroundColor Yellow
    }
    
    "3" {
        Write-Host ""
        Write-Host "RAILWAY SETUP:" -ForegroundColor Green
        Write-Host "1. Push to GitHub (same as option 2)" -ForegroundColor Cyan
        Write-Host "2. Go to https://railway.app" -ForegroundColor Cyan
        Write-Host "3. Sign up with GitHub" -ForegroundColor Cyan
        Write-Host "4. New Project" -ForegroundColor Cyan
        Write-Host "5. Deploy from GitHub" -ForegroundColor Cyan
        Write-Host "6. Railway auto-detects services" -ForegroundColor Cyan
        Write-Host "7. Add env variables" -ForegroundColor Cyan
        Write-Host "8. Deploy!" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "URL: https://agrichain.railway.app" -ForegroundColor Yellow
    }
    
    "Q" {
        Write-Host "Exiting." -ForegroundColor Yellow
        exit 0
    }
    
    default {
        Write-Host "Invalid choice" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "See DEPLOYMENT_GUIDE.md for complete details" -ForegroundColor Cyan
