// server.js - Updated with Listings Persistence
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const PORT = 8080;

// Create HTTP server
const server = http.createServer(app);

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

// In-memory array to store listings
const listings = [];

// WebSocket server integrated with HTTP server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('New client connected');

    // Send existing listings to newly connected client
    if (listings.length > 0) {
        ws.send(JSON.stringify({ type: 'existingListings', listings }));
    }

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            if (data.type === 'newListing') {
                const listing = data.listing;
                listings.push(listing); // Store the new listing
                console.log('New listing created:', listing);

                // Broadcast new listing to all clients
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'newListing',
                            listing: listing
                        }));
                    }
                });
            } else if (data.type === 'newBid') {
                console.log('Received bid:', data);
                const listing = listings.find(l => l.propertyName === data.propertyName);
                if (listing) {
                    listing.currentBid = data.bidAmount; // Update current bid

                    // Broadcast updated bid to all clients
                    wss.clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({
                                type: 'newBid',
                                propertyName: listing.propertyName,
                                bidAmount: listing.currentBid
                            }));
                        }
                    });
                }
            }
        } catch (e) {
            console.error('Invalid message format:', message);
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format.' }));
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Start HTTP and WebSocket server
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
