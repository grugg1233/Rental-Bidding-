const express = require('express');
const https = require('https');  // Changed from `http` to `https`
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 443;  // Updated to use HTTPS port 443

// Load SSL Certificates - Replace with the actual path to your SSL certificate and private key
const options = {
    key: fs.readFileSync('/path/to/your_private_key.pem'),  // Update this line
    cert: fs.readFileSync('/path/to/your_certificate.pem')  // Update this line
};

// In-memory array to store listings
const listings = [];
let clients = [];

// Serve static files
app.use(express.static(path.join(__dirname)));

// Routes to serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/create-listing', (req, res) => {
    res.sendFile(path.join(__dirname, 'post_listing.html'));
});

// SSE endpoint to send data to clients
app.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    res.write(`data: ${JSON.stringify({ type: 'existingListings', listings })}\n\n`);
    clients.push(res);

    req.on('close', () => {
        clients = clients.filter(client => client !== res);
    });
});

// Endpoint to handle new bids
app.post('/newBid', express.json(), (req, res) => {
    const { propertyName, bidAmount } = req.body;
    const listing = listings.find(l => l.propertyName === propertyName);

    if (listing && bidAmount > listing.currentBid) {
        listing.currentBid = bidAmount;

        clients.forEach(client => {
            client.write(`data: ${JSON.stringify({
                type: 'newBid',
                propertyName,
                bidAmount
            })}\n\n`);
        });

        res.json({ success: true, propertyName, bidAmount });
    } else {
        res.status(400).json({ success: false, message: 'Invalid bid.' });
    }
});

// Start HTTPS server with SSL options
https.createServer(options, app).listen(PORT, () => {
    console.log(`Secure server is running on https://localhost:${PORT}`);
});
