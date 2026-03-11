
// Node 24 has global fetch

async function testAddBooking() {
    const payload = {
        "clientName": "Test Client",
        "agent": "Direct",
        "yacht": "Yacht-1",
        "status": "Balance",
        "month": new Date().toISOString(),
        "type": "Dinner Cruise",
        "paymentConfirmationStatus": "CONFIRMED",
        "modeOfPayment": "CARD",
        "totalAmount": 100,
        "commissionPercentage": 0,
        "netAmount": 100,
        "paidAmount": 0,
        "balanceAmount": 100,
        "customAgentName": "Test Custom Agent",
        "customAgentPhone": "123456789"
    };

    try {
        const response = await fetch('http://localhost:3000/api/leads', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': 'temp-user'
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

testAddBooking();
