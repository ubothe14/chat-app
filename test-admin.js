// Test admin login
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5006/api';

async function testAdminLogin() {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@chatapp.com',
        password: 'admin123'
      })
    });

    const data = await response.json();
    console.log('Admin login test:', response.status, data);
  } catch (error) {
    console.error('Admin login test failed:', error);
  }
}

testAdminLogin();