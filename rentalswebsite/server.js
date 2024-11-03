const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 80;  // Default to port 80 or use the port set in the environment

// In-memory array to store listings
const listings = [];
let recentUpdates = [];

// Serve static files
app.use(express.static(path.join(__dirname)));

// Route to serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Route to serve the create listing page
app.get('/create-listing', (req, res) => {
    res.sendFile(path.join(__dirname, 'post_listing.html'));
});

// Endpoint to retrieve all current listings for initial load
app.get('/listings', (req, res) => {
    res.json(listings);
});

// Endpoint to handle adding new listings
app.post('/add-listing', express.json(), (req, res) => {
    const listing = req.body;
    listings.push(listing);

    // Store listing update in recentUpdates for polling clients
    recentUpdates.push({
        type: 'newListing',
        listing
    });

    res.json({ success: true, listing });
});

// Endpoint to handle new bids
app.post('/newBid', express.json(), (req, res) => {
    const { propertyName, bidAmount } = req.body;
    const listing = listings.find(l => l.propertyName === propertyName);

    if (listing && bidAmount > listing.currentBid) {
        listing.currentBid = bidAmount;

        // Store bid update in recentUpdates to be sent to clients
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

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
