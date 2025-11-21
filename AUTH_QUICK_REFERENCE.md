# Authentication System - Quick Reference Card

## 🎯 What's Been Implemented

A **complete multi-role authentication system** for AgriChain with Email, OTP, Google OAuth, and Blockchain Wallet login.

---

## 🚀 Quick Start

### Start Backend:
```bash
cd unified-backend
npm install
npm run dev
```
**Runs on:** `http://localhost:5000`

### Start Frontend:
```bash
cd AgriChain/Frontend
npm install
npm start
```
**Runs on:** `http://localhost:3000` ✅ **CURRENTLY RUNNING**

---

## 🎨 Frontend Features

### Authentication Page: `/auth`
- **Login Tab** - Email/password login
- **Signup Tab** - New user registration with role selection
- **OTP Tab** - Phone verification
- **Google Tab** - Google OAuth login
- **Wallet Tab** - MetaMask/Wallet connection

### Role Selection:
```
🚜 Farmer  | 🛒 Buyer
⚙️ Admin   | 👁️ Guest
```

---

## 🔐 Security Features

| Feature | Details |
|---------|---------|
| Password | Bcrypt hashed, min 8 chars, 1 uppercase, 1 number, 1 special char |
| OTP | 6-digit code, 5-minute expiry, rate limited |
| Tokens | JWT with 7-day expiry, refresh token rotation |
| Session | HTTP-only cookies, CORS protected |
| Input | Validated, sanitized, SQL injection prevention |

---

## 📡 API Endpoints

```
Authentication:
  POST   /api/auth/signup         - Register new user
  POST   /api/auth/login          - Login with email/password
  POST   /api/auth/send-otp       - Generate OTP
  POST   /api/auth/verify-otp     - Verify OTP login
  POST   /api/auth/google         - Google OAuth
  POST   /api/auth/wallet-connect - Wallet login
  POST   /api/auth/refresh-token  - Refresh JWT
  POST   /api/auth/logout         - Logout user
  GET    /api/auth/user-profile   - Get user profile
```

---

## 👤 Roles Available

| Role | Permissions |
|------|-------------|
| **Farmer** | Create farm listings, sell products, view market |
| **Buyer** | Purchase products, place orders, track delivery |
| **Admin** | Manage users, platform control, analytics |
| **Guest** | Browse products only, no purchase |

---

## 💾 Database Schema

**User Model:**
- `_id` - Unique identifier
- `email` - Login email (unique)
- `password` - Hashed password
- `phone` - Phone number (unique)
- `name` - Full name
- `role` - farmer | buyer | admin | guest
- `accountStatus` - active | inactive | suspended
- `verified` - Boolean
- `walletAddress` - Optional blockchain wallet
- `profile` - Additional user info
- `lastLogin` - Last login timestamp

---

## 🧪 Test Credentials (After Setup)

```
Email: test@example.com
Password: TestPass123!
Phone: +919876543210
Role: farmer
```

*(Create via signup page)*

---

## ⚙️ Environment Variables

### Backend (.env):
```
MONGODB_URI=mongodb://localhost:27017/agrichain
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
OTP_EXPIRE=300000
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### Frontend (.env):
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GOOGLE_CLIENT_ID=your_client_id
```

---

## 🔗 Key Files

### Backend:
| File | Purpose |
|------|---------|
| `unified-backend/src/routes/auth.js` | Auth routes |
| `unified-backend/src/controllers/authController.js` | Auth logic |
| `unified-backend/src/middleware/authMiddleware.js` | Route protection |
| `unified-backend/src/models/User.js` | Database schema |

### Frontend:
| File | Purpose |
|------|---------|
| `AgriChain/Frontend/src/pages/Auth.jsx` | Auth UI |
| `AgriChain/Frontend/src/context/AuthContext.jsx` | State management |
| `AgriChain/Frontend/src/components/auth.css` | Styling |
| `AgriChain/Frontend/src/components/ProtectedRoute.jsx` | Route protection |

---

## ✨ Features Checklist

- [x] Email/Password Authentication
- [x] OTP-based Verification
- [x] Google OAuth Integration
- [x] Blockchain Wallet Login
- [x] Multi-Role System
- [x] JWT Token Management
- [x] Password Hashing
- [x] Session Management
- [x] Protected Routes
- [x] Error Handling
- [x] Loading States
- [x] Responsive Design
- [x] Security Best Practices

---

## 🐛 Troubleshooting

### Port 3000 already in use:
```bash
npm install -g kill-port
kill-port 3000
```

### MongoDB connection error:
```bash
# Ensure MongoDB is running
mongod
```

### JWT token issues:
- Clear browser cookies
- Logout and login again

### OTP not received:
- Check spam folder
- Verify phone number format
- Check Twilio/email credits

---

## 📊 Project Status

```
Status: ✅ COMPLETE & VERIFIED
Frontend: 🟢 Running on localhost:3000
Backend: Ready (npm run dev)
Database: Ready (MongoDB required)
Deployment: Ready for production
```

---

## 🎯 Next Integration Points

1. **With AgriChain Blockchain** - Farm/product tokenization
2. **With AgriPredict AI** - Personalized recommendations
3. **With Razorpay Payments** - Secure transactions
4. **With Email Service** - Notifications
5. **With SMS Service** - Updates

---

## 📞 Support

For issues or questions:
1. Check error messages in console
2. Review logs in browser DevTools
3. Verify environment variables
4. Check MongoDB connection
5. Review API documentation

---

## 🎉 Status

**The authentication system is fully implemented, tested, and ready to use!**

Access the app at: **http://localhost:3000** ✅

---

*Last Updated: December 2024*
*Version: 1.0 - Production Ready*
