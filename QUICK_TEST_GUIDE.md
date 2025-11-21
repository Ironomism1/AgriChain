# 🚀 Quick Start - Test the New Features

## ✅ All Systems Running

```
Frontend: http://localhost:3000
Backend: http://localhost:8000
Database: MongoDB (connected)
```

---

## 👨‍🌾 Test as FARMER

### Step 1: Create Farmer Account
```
Go to: http://localhost:3000/signup
Fill:
  Name: John Farmer
  Email: farmer@test.com
  Password: Test123@
  Phone: 9999999999
  Role: 🚜 FARMER
  District: Select your district
```

### Step 2: View Farmer Dashboard
```
Click: "📊 Dashboard" in navbar
Or: http://localhost:3000/farmer-dashboard

See:
  - Active Listings count
  - Active Contracts count
  - Completed Sales count
  - Quick action buttons
```

### Step 3: Create a Listing
```
Click: "➕ Create Listing"
Fill:
  Crop: Paddy
  Quantity: 1000 kg
  Price per kg: ₹25
  Quality: Grade B
  District: [Your district]
  Harvest Date: 2025-12-15
  Description: Premium quality paddy
Click: "Create Listing"
```

### Step 4: View Your Listings
```
Click: "📋 My Listings"
See your created listing with:
  - Edit button
  - Delete button
  - Details
```

---

## 🛒 Test as BUYER

### Step 1: Create Buyer Account
```
Go to: http://localhost:3000/signup
Fill:
  Name: Jane Buyer
  Email: buyer@test.com
  Password: Test123@
  Phone: 8888888888
  Role: 🛒 BUYER
  (No district needed)
```

### Step 2: View Buyer Dashboard
```
Click: "🛒 Dashboard" in navbar
Or: http://localhost:3000/buyer-dashboard

See:
  - Available Listings count
  - Active Contracts count
  - Completed Purchases count
  - Quick action buttons
```

### Step 3: Browse Listings
```
Click: "🌾 Browse" in navbar
Or: http://localhost:3000/listings

See all farmer listings with:
  - Crop name
  - Price per kg
  - Quantity available
  - Farmer details
```

### Step 4: Create Contract
```
Click on a listing
Click: "View Details"
Click: "Create Contract" or
Go to: http://localhost:3000/contract/:listingId

Fill:
  Crop: (auto-filled from listing)
  Quantity: 500 kg
  Price per kg: ₹25
  Quality Grade: Grade B
  Down Payment: 20%
  Payment Schedule: Two Part
  Contract Terms: [add any terms]

Click: "Create Contract"
```

### Step 5: Track Contracts
```
Click: "📄 My Contracts"
See all your active contracts with:
  - Status
  - Amount
  - Crop details
  - Track button
```

---

## 📋 Test Contract Creation

### Unified Form Features:
```
✅ Dropdown selectors for:
  - Quality grade (A, B, C)
  - Unit (kg, ton, quintal)
  - Payment percentage (10%, 20%, 30%, 50%)
  - Payment schedule (Single, Two-Part, Installment)

✅ Auto-calculations:
  - Total Amount = Quantity × Price

✅ Validations:
  - Required fields marked with *
  - Form won't submit incomplete
```

---

## 🔔 Test Notifications

### When Buyer Shows Interest:
```
1. Logout farmer account
2. Login as buyer
3. Go to listing
4. Click "Interested"
5. Should see: "Interest marked successfully"
6. Farmer would get notifications:
   - In-app notification
   - Email notification (if configured)
   - SMS notification (if configured)
```

---

## ⚙️ Test Settings

### Settings Page Changes:
```
Go to: http://localhost:3000/settings

Tabs available:
✅ 👤 Profile Settings
✅ 💰 Payment Settings
✅ 🔔 Notifications
✅ 🔐 Privacy

❌ Theme & Display (REMOVED)
```

---

## 🧪 Test Form Dropdowns

### Create Listing Form:
```
http://localhost:3000/create-listing

Dropdowns working:
✅ Quality Grade selector
✅ All input fields accept values
✅ Form validation works
```

### Create Contract Form:
```
http://localhost:3000/contract

Dropdowns working:
✅ Quality grade (A, B, C)
✅ Unit selector (kg, ton, quintal)
✅ Down payment % (10-50%)
✅ Payment schedule (Single/Two-Part/Installment)
✅ Auto-calculation of total
✅ All validations working
```

---

## 📱 Role-Based Navigation

### Farmer sees:
```
Navbar:
- Home
- All Listings
- Payment Requests (if logged in)
- Transaction History (if logged in)
- Settings (if logged in)
- 📊 Dashboard (FARMER)
- ➕ Create Listing (FARMER)
- 📋 My Listings (FARMER)
- 📄 Contracts (FARMER)
```

### Buyer sees:
```
Navbar:
- Home
- All Listings
- Payment Requests (if logged in)
- Transaction History (if logged in)
- Settings (if logged in)
- 🛒 Dashboard (BUYER)
- 🌾 Browse (BUYER)
- 📄 My Contracts (BUYER)
```

---

## 🐛 Troubleshooting

### Dashboard not showing?
```
Check:
1. Are you logged in? (token in localStorage)
2. Is userRole set correctly? (localStorage: userRole = 'farmer' or 'buyer')
3. Check browser console for errors (F12 → Console)
```

### Form not submitting?
```
Check:
1. All required fields filled (marked with *)
2. Valid email format
3. Valid phone number
4. Quantity and price are numbers
5. Check browser console for validation errors
```

### Notifications not received?
```
This is expected if:
1. Email credentials not configured (.env)
2. Twilio credentials not configured (.env)
3. Check backend logs at http://localhost:8000
4. In-app notifications always work
```

### Dropdown not working?
```
Check:
1. Browser console (F12 → Console) for JS errors
2. Reload page (Ctrl+F5)
3. Clear localStorage and try again
4. Check network requests (F12 → Network)
```

---

## ✅ Expected Results

### ✅ You should see:
- Farmer dashboard when logged as farmer
- Buyer dashboard when logged as buyer
- Different navbar menus for each role
- All dropdowns working properly
- Forms accepting and validating data
- Auto-calculation of contract total
- Settings without theme option

### ✅ Features working:
- Create listings (farmers only)
- Browse listings (buyers only)
- Create contracts (both)
- View dashboards (both)
- Role-based navigation
- Form validation
- Proper error messages

---

## 🎉 You're All Set!

All features are implemented and working. Test them and let me know if you need any adjustments!

**Quick Links:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Full Implementation Guide: FEATURE_IMPLEMENTATION_COMPLETE.md
