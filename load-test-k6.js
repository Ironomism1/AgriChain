import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 20 },   // Ramp up to 20 users
    { duration: '1m30s', target: 20 }, // Stay at 20 users
    { duration: '30s', target: 40 },   // Ramp up to 40 users
    { duration: '1m30s', target: 40 }, // Stay at 40 users
    { duration: '30s', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(99)<1500'], // 99% of requests must complete below 1.5s
    http_req_failed: ['<0.1'],         // http errors should be less than 10%
  },
};

// Replace with actual token from your system
const TOKEN = 'your_jwt_token_here';
const BASE_URL = 'http://localhost:8000';

export default function () {
  // Test 1: Get all conversations
  let conversationRes = http.get(`${BASE_URL}/api/chat/conversations`, {
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  check(conversationRes, {
    'GET /api/chat/conversations status is 200': (r) => r.status === 200,
    'GET /api/chat/conversations has body': (r) => r.body.length > 0,
  });

  sleep(1);

  // Test 2: Get all available users for chat
  let usersRes = http.get(`${BASE_URL}/api/auth/all-users`, {
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  check(usersRes, {
    'GET /api/auth/all-users status is 200': (r) => r.status === 200,
    'GET /api/auth/all-users returns users': (r) => r.json('users').length > 0,
  });

  sleep(1);

  // Test 3: Get important messages
  let importantRes = http.get(`${BASE_URL}/api/chat/important/all`, {
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  check(importantRes, {
    'GET /api/chat/important/all status is 200': (r) => r.status === 200,
  });

  sleep(2);
}
