
async function testAddAgent() {
    const payload = {
        "id": "TEST-AGENT-001",
        "name": "Test Agent",
        "email": "testagent@example.com",
        "discount": 10,
        "status": "Active"
    };

    try {
        const response = await fetch('http://localhost:3000/api/agents', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log('STATUS:', response.status);
        console.log('DATA:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('FETCH ERROR:', err.message);
    }
}

testAddAgent();
