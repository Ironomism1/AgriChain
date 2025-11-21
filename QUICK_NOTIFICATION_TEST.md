# ⚡ Quick Test Guide - Notification System

## Prerequisites
- Backend running on **port 8000** ✓
- Frontend running on **port 3000** ✓
- MongoDB connected ✓

---

## 🧪 Test Flow (5 minutes)

### Step 1: Login as Buyer (1 min)
1. Go to **http://localhost:3000**
2. Click "Register" or "Login"
3. **Important:** Select role as **"buyer"**
4. Create account or login
5. Note the token from response

**Expected:** Login successful, get JWT token with `"role": "buyer"`

---

### Step 2: Browse Listings (1 min)
1. After login, go to **"Explore Marketplace"** or **"Browse Listings"**
2. You should see crop listings
3. Each listing should have an **"Interested"** button

**Expected:** See listings displayed with prices and quantities

---

### Step 3: Click "Interested" (1 min)
1. Find any listing (e.g., "Paddy 1000 kg ₹35/kg")
2. Click the **"Interested"** button
3. Watch for response

**Expected Results:**
- ✅ Button shows "Interest marked successfully"
- ✅ No error message
- ✅ Page doesn't crash

**If you see error:**
```json
{
  "error": "Access denied",
  "userRole": "farmer",
  "message": "Your role 'farmer' is not allowed..."
}
```
→ You logged in as **farmer** instead of **buyer**. Re-register as buyer!

---

### Step 4: Verify Notification (2 min)

#### In Frontend
1. **Real-time:** Farmer should see notification pop-up instantly
2. **In-app:** Click "Notifications" menu
3. **Should show:** "New Buyer Interested!" with buyer's name

#### In Backend Terminal
Look for:
```
Role check: User role='buyer', Allowed roles='buyer'
✓ Notification created for farmer
✓ Email sending initiated
```

#### In Database
```bash
# Open mongosh
db.notifications.findOne({type: "buyer_interested"})
# Should show the notification document
```

---

## 📧 Email Testing

### To receive emails:
1. Open `.env` file
2. Add Gmail credentials:
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
```

### Get Gmail App Password:
1. Go to **myaccount.google.com**
2. Security (left menu)
3. App passwords
4. Generate new app password
5. Copy the 16-character password

### Then:
1. Click "Interested" again
2. Check email inbox (may take 5-30 seconds)
3. Should receive professional HTML email

---

## 📱 SMS Testing

SMS is auto-configured if Twilio credentials in `.env`:
```env
TWILIO_ACCOUNT_SID=xxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE=+1234567890
```

Check phone for SMS after clicking "Interested"

---

## 🔍 Detailed Testing (Advanced)

### Test with cURL

Get token first:
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"buyer@example.com","password":"password123"}'

# Response:
# {
#   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "user": {"id": "123...", "role": "buyer"}
# }
```

Click "Interested":
```bash
curl -X POST http://localhost:8000/api/listings/[LISTING_ID]/interested \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"

# Expected: 200 OK
# {
#   "message": "Interest marked successfully",
#   "interestedCount": 1
# }
```

Get notifications:
```bash
curl http://localhost:8000/api/notifications \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Should show array of notifications
```

---

## ✅ Success Indicators

| Component | Status | Check |
|-----------|--------|-------|
| **Frontend** | ✓ Working | See "Interest marked" message |
| **Backend** | ✓ Running | Port 8000 active, logs show role check |
| **Database** | ✓ Connected | Notification document created |
| **Email** | ✓ Working | Email arrives (needs .env) |
| **SMS** | ✓ Working | SMS arrives (needs Twilio) |
| **Real-time** | ✓ Working | Farmer sees pop-up instantly |

---

## ❌ Troubleshooting

### Error: "Access denied" (403)
- You logged in as **farmer**
- Need to login as **buyer** role
- Check user role in JWT token

### Error: "No token provided" (401)
- Token not included in request
- Check "Authorization: Bearer xxx" header
- Token might be expired (login again)

### Error: "Listing not found"
- Listing ID is invalid
- Listing was deleted
- Use correct listing ID from database

### Error: "Already marked as interested"
- You already clicked interested on this listing
- Try a different listing
- Or clear interestedBuyers array for testing

### Email not arriving
- Add EMAIL_USER and EMAIL_PASSWORD to .env
- Get valid Gmail app password
- Check spam folder

### SMS not arriving  
- Add TWILIO credentials to .env
- Verify phone number format (with country code)
- Check Twilio account balance

---

## 📋 Checklist

- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000
- [ ] Logged in as **buyer** (checked role in token)
- [ ] Can see listings on marketplace
- [ ] Can click "Interested" button
- [ ] Get "Interest marked successfully" response
- [ ] No error messages
- [ ] Farmer receives notification
- [ ] (Optional) Email arrives in inbox
- [ ] (Optional) SMS arrives on phone

---

## 🎉 When Everything Works

After clicking "Interested", farmer instantly receives:

1. **Real-time pop-up** on their browser
2. **Email** in their inbox  
3. **SMS** on their phone
4. **In-app notification** in notification center
5. **Database record** in notifications collection

---

## 📞 Get Help

If test fails:
1. Check backend terminal for error logs
2. Look for "Role check:" message
3. Verify token includes "role": "buyer"
4. Check that user exists in database with buyer role

---

## 🚀 Ready to Test?

1. Make sure backend is running
2. Login to frontend as **buyer**
3. Click "Interested" on any listing
4. Verify notification appears

**Let's go! 🎯**
