# 🔍 TROUBLESHOOTING GUIDE - "Access Denied" Error

## The Error You're Seeing

```
localhost:3000 says
Access denied

POST http://localhost:8000/api/listings/[id]/interested 403 (Forbidden)
```

---

## ✅ Root Cause Analysis

### What the Error Means

You tried to perform an action (click "Interested") that requires **BUYER role**, but you have **FARMER role**.

### Why It Happens

The system has role-based access control:
- **Farmers** create listings
- **Buyers** click "Interested"

You need the right role for the right action.

---

## 🔧 QUICK FIX

### Single Source of Truth

```
❌ WRONG: Logged in as FARMER
✅ RIGHT: Logged in as BUYER
```

### How to Fix

**Option 1: Create New Buyer Account**
1. Go to http://localhost:3000
2. Click Register
3. Fill form
4. **IMPORTANT:** Role = "BUYER"
5. Create account
6. Try clicking "Interested" again

**Option 2: Check Your Current Account**
1. Open browser DevTools (F12)
2. Go to Application → LocalStorage
3. Find JWT token
4. Look for: `"role": "???"`
5. If farmer → Need buyer account
6. If buyer → Should work (check other issues)

---

## 📋 THE DETAILED DIAGNOSIS

### Step 1: Check Your Login Role

**In Backend Error Response:**
```json
{
  "error": "Access denied",
  "userRole": "farmer",        ← YOUR ROLE
  "allowedRoles": ["buyer"],   ← WHAT'S NEEDED
  "message": "..."
}
```

**What this tells you:**
- ✓ Your role: **farmer**
- ✓ Required role: **buyer**
- ✓ Action: Login as buyer

### Step 2: Check Backend Logs

Terminal should show:
```
Role check: User role='farmer', Allowed roles='buyer'  ← PROBLEM
```

Not:
```
Role check: User role='buyer', Allowed roles='buyer'   ← GOOD ✓
```

### Step 3: Check Request Headers

DevTools → Network Tab:

**Good request:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Bad request:**
```
(missing Authorization header)
```

---

## 🎯 SOLUTIONS BY SCENARIO

### Scenario 1: You're Logged in as Farmer

**Symptoms:**
- Error shows: `"userRole": "farmer"`
- Can't click "Interested"
- Can create listings

**Solution:**
1. Logout
2. Register as BUYER
3. Try again

**Time to fix:** 2 minutes

---

### Scenario 2: You're Logged in as Buyer But Still Error

**Symptoms:**
- Token shows: `"role": "buyer"`
- Still getting 403 error
- Backend shows correct role

**Solutions:**
1. **Clear browser cache:**
   - DevTools → Clear storage
   - Refresh page
   - Try again

2. **Check listing:**
   - Make sure listing exists
   - Not deleted or inactive
   - Is created by different farmer

3. **Check token expiry:**
   - Login again to get fresh token
   - Tokens expire after 7 days
   - Old token might be invalid

**Time to fix:** 2-5 minutes

---

### Scenario 3: Backend Not Running

**Symptoms:**
- Connection refused
- Cannot reach localhost:8000
- No response from backend

**Solution:**
1. Check terminal
2. Should show: `Port: 8000`
3. If not, backend crashed
4. Restart with: `npm start`

**Time to fix:** 1 minute

---

### Scenario 4: No Token Sent

**Symptoms:**
- Error: "No token provided" (401)
- Not "Access denied" (403)
- Frontend not including authorization header

**Solution:**
1. This is a frontend issue
2. Frontend should include token automatically
3. Check browser localStorage
4. Should have JWT token saved
5. If not, login again

**Time to fix:** 2 minutes

---

## 🧪 VERIFICATION TESTS

### Test 1: Role Check
```bash
# After login, check token
Open DevTools Console
const token = localStorage.getItem('token');
jwt_decode(token).role
# Should show: "buyer"
```

### Test 2: Backend Connectivity
```bash
curl http://localhost:8000/health
# Should return: 
# {"status":"Server running","timestamp":"...","version":"1.0.0"}
```

### Test 3: API Call with Token
```bash
curl -X POST http://localhost:8000/api/listings/[ID]/interested \
  -H "Authorization: Bearer YOUR_TOKEN"
# Should return: 200 OK (if buyer)
# Should return: 403 (if farmer)
```

---

## 📊 ERROR DECISION TREE

```
Getting "Access Denied"?
    │
    ├─ YES: Check error details
    │   │
    │   ├─ Shows "userRole": "farmer"?
    │   │   └─ LOGIN AS BUYER ✓
    │   │
    │   ├─ Shows "userRole": "buyer"?
    │   │   ├─ Clear cache and try again
    │   │   ├─ Check listing exists
    │   │   └─ Get fresh token
    │   │
    │   └─ Shows "No token provided"?
    │       └─ Token not saved in browser
    │
    └─ NO: Connection error?
        ├─ Backend running?
        │   └─ If no, start with: npm start
        │
        └─ Network issue?
            └─ Check internet connectivity
```

---

## 🆘 COMMON MISTAKES

### Mistake 1: Register as Farmer
```
❌ WRONG:
Role: Farmer
Phone: 9876543210
Then try clicking "Interested"

✅ RIGHT:
Role: Buyer
Then clicking "Interested" works
```

### Mistake 2: Same Browser, Same Token
```
❌ WRONG:
Login as farmer
Click "Interested"
❌ Access Denied

❌ WRONG (next step):
Just refreshing page doesn't change role

✅ RIGHT:
Logout completely
Clear browser storage
Login as BUYER
Try again
```

### Mistake 3: Wrong Listing
```
❌ WRONG:
Click "Interested" on your own listing
(If you created it, you're a farmer)

✅ RIGHT:
Click "Interested" on someone else's listing
(Created by different farmer)
```

### Mistake 4: Expired Token
```
❌ WRONG:
Login 7 days ago
Token is expired
Still using old token

✅ RIGHT:
Login fresh
Get new token
Use immediately
```

---

## 📈 BEFORE & AFTER

### Before Fix
```
Error response:
{
  "error": "Access denied"
}

❌ Confusing - doesn't explain what role you have
❌ Doesn't say what role is needed
❌ No guidance on how to fix
```

### After Fix
```
Error response:
{
  "error": "Access denied",
  "userRole": "farmer",
  "allowedRoles": ["buyer"],
  "message": "Your role 'farmer' is not 
              allowed. Allowed roles: buyer"
}

✅ Clear - shows your exact role
✅ Helpful - shows needed role
✅ Actionable - tells you what to do
```

---

## 🎯 FINAL CHECKLIST

- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000
- [ ] Logged in with BUYER role
- [ ] Token saved in browser
- [ ] Token not expired
- [ ] Listing exists and is active
- [ ] Listing created by different farmer
- [ ] Authorization header sent with request

**All checked? ✓**

If yes → Click "Interested" and see success message!

---

## 🎊 RESOLUTION SUMMARY

| Issue | Cause | Fix | Time |
|-------|-------|-----|------|
| Access Denied | Wrong role (farmer) | Login as buyer | 2 min |
| No token | Not logged in | Login | 1 min |
| Expired token | 7+ days old | Login again | 1 min |
| Backend error | Server crashed | npm start | 1 min |
| DB error | No connection | Check MongoDB | 2 min |

---

## 📞 GET HELP

1. **Quick answer:** Check ROLE_BASED_ACCESS_EXPLAINED.md
2. **Step-by-step:** Follow QUICK_NOTIFICATION_TEST.md
3. **All details:** Read COMPLETE_FIX_SUMMARY.md
4. **Error details:** Check backend terminal output

---

## ✅ STATUS

The system is working correctly!

The "Access Denied" error is actually a sign that **security is working properly** - it's preventing unauthorized access.

**Just login with the right role and everything will work! 🎉**
