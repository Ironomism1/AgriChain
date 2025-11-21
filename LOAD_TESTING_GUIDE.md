# AgriChain Load Testing Guide

## Option 1: Using JMeter GUI (Easiest)

### Step 1: Open JMeter
```powershell
cd "C:\path\to\apache-jmeter-5.6.3\bin"
.\jmeter.bat
```

### Step 2: Load the Test Plan
1. File > Open
2. Select: `load-test-chat.jmx`
3. Update TOKEN variable with your JWT token
4. Click Run (Green Play Button)

### Step 3: View Results
- Summary Report shows average response time, throughput, errors
- Response times, error rates in real-time

---

## Option 2: Using K6 (Faster, Recommended)

### Step 1: Install K6
```powershell
# Using Chocolatey
choco install k6

# Or with npm
npm install -g k6

# Or download from https://k6.io/docs/getting-started/installation/
```

### Step 2: Get Your JWT Token
1. Login to your app at http://localhost:3001
2. Open browser Developer Tools (F12)
3. Go to Console and paste:
```javascript
console.log(localStorage.getItem('token'))
```
4. Copy the token

### Step 3: Update the K6 Script
Edit `load-test-k6.js` and replace:
```javascript
const TOKEN = 'your_jwt_token_here';
```
With your actual token

### Step 4: Run the Load Test
```powershell
cd "C:\Users\Shriyansh Mishra\Documents\Codes\Projects\P"
k6 run load-test-k6.js
```

### Step 5: Interpret Results
- **http_req_duration**: Average response time (should be < 1500ms)
- **http_req_failed**: Error percentage (should be < 10%)
- **checks**: Pass/fail rate for each endpoint
- **VU**: Virtual users active

---

## Test Scenarios in Scripts

### K6 Script Tests:
1. **GET /api/chat/conversations** (50 calls)
   - Tests fetching user conversations
   - 40+ concurrent users
   - Measures response time

2. **GET /api/auth/all-users** (40+ calls)
   - Tests getting available users for chat
   - Measures database query performance

3. **GET /api/chat/important/all** (40+ calls)
   - Tests fetching important messages
   - Filter performance under load

---

## What to Monitor

### Key Metrics:
- **Response Time** (P95, P99): How fast responses are
- **Error Rate**: % of failed requests
- **Throughput**: Requests/sec the server handles
- **Virtual Users**: Number of concurrent connections

### Performance Targets:
- Response Time P99: < 1500ms
- Error Rate: < 10%
- Throughput: > 100 req/sec
- Database latency: < 300ms

---

## Advanced: Custom Load Tests

### Test Different Endpoints:
Edit `load-test-k6.js` to add:

```javascript
// POST new message
let sendRes = http.post(`${BASE_URL}/api/chat/send`, 
  JSON.stringify({
    participantId: 'user_id',
    content: 'Test message',
    conversationId: 'conv_id'
  }),
  {
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
  }
);

check(sendRes, {
  'POST /api/chat/send status is 200': (r) => r.status === 200,
});
```

---

## Troubleshooting

### JMeter Won't Start
- Make sure Java 8+ is installed
- Check: `java -version` in terminal

### K6 Token Error
- Token might have expired
- Login again and get new token
- Or test without auth for public endpoints

### Connection Refused
- Make sure backend is running on port 8000
- Check: `npm start` in unified-backend folder

### Test Results Show High Errors
- Increase response timeout
- Check backend logs for issues
- Reduce concurrent users (VU)

---

## Generated Reports

After running K6:
- Console shows real-time metrics
- Summary statistics at end
- Can export to JSON: `k6 run --out json=results.json load-test-k6.js`

---

## Next Steps

1. **Run baseline test** (current capacity)
2. **Identify bottlenecks** (slow endpoints)
3. **Optimize database queries** (add indexes)
4. **Scale horizontally** (more servers)
5. **Retest** to verify improvements
