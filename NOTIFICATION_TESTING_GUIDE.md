# 🧪 Notification System Testing Guide

## Quick Test: Verify System is Working

### Prerequisites
- Backend running on port 8000 ✓
- Frontend running on port 3000 ✓
- Both servers should be active

---

## Test Flow: Complete End-to-End

### Step 1: Create Test Users (if needed)
Use your app's registration to create:
- **Farmer Account** (email: farmer@test.com, phone: +1234567890)
- **Buyer Account** (email: buyer@test.com)

### Step 2: Create a Test Listing (as Farmer)
1. Log in as farmer
2. Go to "Create Listing"
3. Fill in:
   - Crop: "Rice"
   - Quantity: 100 kg
   - Price: 5000
   - Location: "Hyderabad"
4. Submit
5. Note the Listing ID from response or URL

### Step 3: Test "Interested" Notification
1. Log in as buyer
2. Browse listings
3. Find the farmer's rice listing
4. Click "Mark as Interested"
5. **Verify 4 notifications sent:**

#### ✓ Email Notification
- Check farmer's email inbox
- Should see: "🌾 Buyer Interested in Your Rice Listing!"
- Should have link to "View on AgriChain"

#### ✓ SMS Notification
- Check farmer's phone
- Should see: "A buyer is interested in your Rice listing..."

#### ✓ Real-time Socket Notification
- If both users on app simultaneously
- Farmer sees toast/popup: "New buyer interested"

#### ✓ Database Notification
- Check MongoDB:
```javascript
db.notifications.findOne({
  userId: farmerId,
  type: "buyer_interested"
})
```
- Should show all fields (read=false, emailSent=true, etc)

---

## API Testing (Postman / cURL)

### 1. Get Notifications
```bash
curl -X GET http://localhost:8000/api/notifications \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "_id": "...",
      "userId": "...",
      "type": "buyer_interested",
      "title": "New Buyer Interested!",
      "message": "John Doe is interested in your Rice listing",
      "read": false,
      "emailSent": true,
      "emailSentAt": "2024-01-15T10:30:00Z",
      "inAppNotified": true,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

### 2. Get Unread Count
```bash
curl -X GET http://localhost:8000/api/notifications/unread-count \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "unreadCount": 1
}
```

### 3. Mark Notification as Read
```bash
curl -X PUT http://localhost:8000/api/notifications/NOTIF_ID/read \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "notification": {
    "_id": "...",
    "read": true,
    "readAt": "2024-01-15T10:35:00Z"
  }
}
```

### 4. Mark All as Read
```bash
curl -X PUT http://localhost:8000/api/notifications/mark-all-read \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "5 notifications marked as read"
}
```

### 5. Get User Preferences
```bash
curl -X GET http://localhost:8000/api/notifications/user/preferences \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "preferences": {
    "emailPreference": true,
    "pushPreference": true
  }
}
```

### 6. Update Preferences
```bash
curl -X PUT http://localhost:8000/api/notifications/user/preferences \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "emailPreference": false,
    "pushPreference": true
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Preferences updated",
  "preferences": {
    "emailPreference": false,
    "pushPreference": true
  }
}
```

### 7. Get Single Notification
```bash
curl -X GET http://localhost:8000/api/notifications/NOTIF_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 8. Delete Notification
```bash
curl -X DELETE http://localhost:8000/api/notifications/NOTIF_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Troubleshooting

### Email Not Sending?
**Check 1: .env file**
```env
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
```

**Check 2: Gmail Settings**
- Enable 2-factor authentication
- Generate app-specific password
- Use 16-character password (not regular password)

**Check 3: Backend Logs**
```
"Error: Email sending error..." 
```
- Check EMAIL_USER and EMAIL_PASSWORD
- Verify Gmail account allows SMTP

### SMS Not Sending?
**Check 1: .env file**
```env
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE=+1234567890
```

**Check 2: Farmer Phone**
- Make sure farmer has phone number saved
- Phone should be in international format

### Notifications Not Appearing in Database?
**Check 1: Backend Logs**
```
"Error fetching notifications..."
```

**Check 2: Authentication**
- Make sure JWT token is valid
- User ID matches the logged-in user

**Check 3: MongoDB**
```javascript
// In MongoDB shell:
db.notifications.count()
db.notifications.find({userId: ObjectId("...")})
```

---

## Email Testing with Gmail

### Setup Gmail App Password:
1. Go to myaccount.google.com
2. Click "Security" in left sidebar
3. Enable "2-Step Verification" (if not already)
4. Search "App passwords"
5. Select "Mail" and "Windows Computer"
6. Copy the 16-character password
7. Paste in .env as EMAIL_PASSWORD

### Testing Email Delivery:
1. Set EMAIL_USER to your test Gmail
2. Trigger "interested" event
3. Check Gmail inbox (might be in Promotions tab)
4. Check for "AgriChain" sender

---

## Real-time Testing (Socket.io)

### Check Socket Connection:
1. Open browser DevTools (F12)
2. Go to Application → Storage → Cookies
3. Check for socket.io session
4. Go to Network → WebSocket
5. Should see socket.io connection

### Test Real-time Event:
1. Open app in 2 browser tabs
2. Tab 1: Log in as Farmer
3. Tab 2: Log in as Buyer
4. Tab 2: Click "Interested"
5. Tab 1: Should show toast notification immediately

---

## Database Verification

### Check Notification Document:
```javascript
// MongoDB Compass or mongosh
db.notifications.findOne({
  type: "buyer_interested"
}, {sort: {createdAt: -1}})

// Output:
{
  "_id": ObjectId("..."),
  "userId": ObjectId("farmerId..."),
  "type": "buyer_interested",
  "title": "New Buyer Interested!",
  "message": "John Doe is interested in your Rice listing",
  "relatedId": ObjectId("listingId..."),
  "relatedType": "Listing",
  "data": {
    "crop": "Rice",
    "quantity": 100,
    "buyerName": "John Doe",
    "buyerId": ObjectId("..."),
    "listingId": ObjectId("...")
  },
  "read": false,
  "readAt": null,
  "emailSent": true,
  "emailSentAt": ISODate("2024-01-15T10:30:00.000Z"),
  "emailError": null,
  "inAppNotified": true,
  "inAppNotifiedAt": ISODate("2024-01-15T10:30:00.000Z"),
  "emailPreference": true,
  "pushPreference": true,
  "createdAt": ISODate("2024-01-15T10:30:00.000Z"),
  "updatedAt": ISODate("2024-01-15T10:30:00.000Z"),
  "expiresAt": ISODate("2024-02-14T10:30:00.000Z")  // 30 days later
}
```

### Check Indexes:
```javascript
db.notifications.getIndexes()

// Should show:
{
  "key": {"userId": 1, "createdAt": -1},
  "name": "userId_1_createdAt_-1"
},
{
  "key": {"userId": 1, "read": 1, "createdAt": -1},
  "name": "userId_1_read_1_createdAt_-1"
},
{
  "key": {"userId": 1, "type": 1, "createdAt": -1},
  "name": "userId_1_type_1_createdAt_-1"
},
{
  "key": {"expiresAt": 1},
  "expireAfterSeconds": 0,
  "name": "expiresAt_1"
}
```

---

## Performance Testing

### Test 1: Query Performance
```javascript
// MongoDB - Should be <10ms
db.notifications.find({userId: ObjectId("...")}).explain("executionStats")
// Check executionTimeMillis
```

### Test 2: Large Dataset
```javascript
// Create 1000 notifications
for (let i = 0; i < 1000; i++) {
  db.notifications.insertOne({
    userId: ObjectId("testUser"),
    type: "buyer_interested",
    message: `Test ${i}`,
    createdAt: new Date()
  })
}

// Query should still be fast
db.notifications.find({userId: ObjectId("testUser")}).limit(10)
```

---

## Success Criteria

✅ **Test Passes if:**
1. Email received in farmer's inbox
2. SMS received on farmer's phone
3. GET /notifications returns data
4. Notifications marked as read updates correctly
5. Unread count is accurate
6. Preferences update works
7. Database shows notification stored
8. Socket.io real-time event fires
9. Auto-cleanup after 30 days (verify with TTL)
10. Performance is fast (<100ms for queries)

---

## Status Checkpoints

| Component | Test | Status |
|-----------|------|--------|
| Email Service | Send test email | ✓ Ready |
| SMS Service | Send test SMS | ✓ Ready |
| Database | Store notification | ✓ Ready |
| API Endpoints | GET/PUT/DELETE | ✓ Ready |
| Real-time | Socket.io events | ✓ Ready |
| Preferences | Toggle on/off | ✓ Ready |
| Auto-cleanup | TTL after 30 days | ✓ Ready |

---

## Contact for Issues

If any test fails:
1. Check backend logs: `npm start`
2. Check .env configuration
3. Verify MongoDB connection
4. Check network tab in browser DevTools
5. Review error messages in response

Everything should be working! Test the system now. 🚀
