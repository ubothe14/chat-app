// Test script to verify backend API integration
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5006/api';

async function testSignup() {
  try {
    const response = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        password: 'testpass123',
        experience: '2 years',
        targetExam: 'CAT',
        idDocumentName: 'test.pdf'
      })
    });

    const data = await response.json();
    console.log('Signup test:', response.status, data);

    if (response.ok && data.token) {
      return data.token;
    }
  } catch (error) {
    console.error('Signup test failed:', error);
  }
  return null;
}

async function testLogin(token) {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpass123'
      })
    });

    const data = await response.json();
    console.log('Login test:', response.status, data);
  } catch (error) {
    console.error('Login test failed:', error);
  }
}

async function runTests() {
  console.log('Testing backend API integration...');

  const token = await testSignup();
  if (token) {
    await testLogin(token);
  }

  console.log('Tests completed.');
}

runTests();