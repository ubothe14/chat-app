// Test admin API
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5006/api';
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZDM5ZjhjNGExZmEzYjM2MzU2MDI4ZiIsImVtYWlsIjoiYWRtaW5AY2hhdGFwcC5jb20iLCJpYXQiOjE3NzU0NzY4NTIsImV4cCI6MTc3NjA4MTY1Mn0.lLmMCSCC_q4efXxR_8m3XL8fAhyidXI2oUNLqIA1l1Q';

async function testAdminAPI() {
  try {
    const response = await fetch(`${API_BASE}/users/admin/all`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
      }
    });

    const data = await response.json();
    console.log('Admin get users test:', response.status);
    console.log('Users count:', data.users?.length || 0);
    if (data.users) {
      data.users.forEach(user => {
        console.log(`- ${user.name} (${user.email}) - ${user.role}`);
      });
    }
  } catch (error) {
    console.error('Admin API test failed:', error);
  }
}

testAdminAPI();