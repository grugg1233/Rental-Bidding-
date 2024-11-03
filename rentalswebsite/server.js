const express = require('express');
const http = require('http');
const path = require('path');

const app = express();
const PORT = 8080;

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

app.get('/contact', (req, res) => {
    res.send('<h1>Contact Us</h1><p>Please contact us at contact@rentalbids.com.</p>');
});

// SSE endpoint to send data to clients
app.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    res.write(`data: ${JSON.stringify({ type: 'existingListings', listings })}\\n\\n`);
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
            })}\\n\\n`);
        });

        res.json({ success: true, propertyName, bidAmount });
    } else {
        res.status(400).json({ success: false, message: 'Invalid bid.' });
    }
});

// Start HTTP server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
