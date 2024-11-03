const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 80;  // Use cPanel-assigned port or default to 80

// In-memory array to store listings
const listings = [];
let recentUpdates = [];

// Serve static files
app.use(express.static(path.join(__dirname)));

// Routes to serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/create-listing', (req, res) => {
    res.sendFile(path.join(__dirname, 'post_listing.html'));
});

// Endpoint to handle polling requests for updates
app.get('/get-updates', (req, res) => {
    res.json(recentUpdates);
    recentUpdates = [];  // Clear updates after sending
});

// Endpoint to handle new bids
app.post('/newBid', express.json(), (req, res) => {
    const { propertyName, bidAmount } = req.body;
    const listing = listings.find(l => l.propertyName === propertyName);

    if (listing && bidAmount > listing.currentBid) {
        listing.currentBid = bidAmount;

        // Store bid update in recentUpdates to be sent to clients on next poll
        recentUpdates.push({
            type: 'newBid',
            propertyName,
            bidAmount
        });

        res.json({ success: true, propertyName, bidAmount });
    } else {
        res.status(400).json({ success: false, message: 'Invalid bid.' });
    }
});

// Add an endpoint to create new listings
app.post('/add-listing', express.json(), (req, res) => {
    const listing = req.body;
    listings.push(listing);

    // Store listing update in recentUpdates to be sent to clients on next poll
    recentUpdates.push({
        type: 'newListing',
        listing
    });

    res.json({ success: true, listing });
});

// Start HTTP server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
