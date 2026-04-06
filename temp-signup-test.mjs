import fetch from 'node-fetch'

async function main() {
  try {
    const res = await fetch('http://localhost:5006/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'API Test User',
        email: 'apitest' + Date.now() + '@example.com',
        phone: '+1234567890',
        password: 'testpass123',
        experience: '0',
        targetExam: 'All',
        idDocumentName: 'test.pdf'
      })
    })
    console.log('status', res.status)
    console.log(await res.text())
  } catch (err) {
    console.error('error', err)
  }
}

main()
