document.addEventListener('DOMContentLoaded', () => {
    const listingsContainer = document.getElementById('listings-container');

    // Establish WebSocket connection using the same port as the server
    const socket = new WebSocket('ws://3.132.82.18:8080');



    socket.onopen = () => {
        document.getElementById('status').textContent = 'Connected to WebSocket server!';
        console.log('WebSocket connection established.');
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'newListing') {
            console.log('New listing received:', data.listing);
            addListing(data.listing);
        } else if (data.type === 'newBid') {
            console.log('New bid received:', data);
            updateBid(data);
        } else if (data.type === 'existingListings') {
            console.log('Existing listings received:', data.listings);
            data.listings.forEach(listing => addListing(listing));
        }
    };

    socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        document.getElementById('status').textContent = 'Failed to connect to WebSocket server.';
    };

    socket.onclose = () => {
        document.getElementById('status').textContent = 'Disconnected from WebSocket server.';
        console.log('WebSocket connection closed.');
    };

    // Function to add a new listing to the DOM
    function addListing(listing) {
        const listingDiv = document.createElement('div');
        listingDiv.classList.add('col-md-4', 'listing-card');
        listingDiv.innerHTML = `
            <div class="card clickable-listing">
                <img src="${listing.imgUrl}" class="card-img-top" alt="${listing.propertyName}" style="width: 400px; height: 400px; object-fit: cover;">
                <div class="card-body">
                    <h5 class="card-title">${listing.propertyName}</h5>
                    <p class="card-text">${listing.description}</p>
                    <p class="card-text">Starting Bid: $${listing.startingBid}</p>
                    <p class="card-text current-bid" data-property="${listing.propertyName}">Current Bid: $${listing.currentBid}</p>
                    <p class="card-address">${listing.streetAddress}, ${listing.city}, ${listing.state}, ${listing.postalCode}</p>
                    <button class="btn btn-primary btn-bid" data-property="${listing.propertyName}">Bid Now</button>
                </div>
            </div>
        `;
        listingsContainer.appendChild(listingDiv);

        // Add event listener to the card (except the "Bid Now" button) to navigate to detailed view
        listingDiv.querySelector('.clickable-listing').addEventListener('click', (event) => {
            if (!event.target.classList.contains('btn-bid')) {
                localStorage.setItem('selectedListing', JSON.stringify(listing));
                window.location.href = 'listing_details.html';
            }
        });

        // Add event listener to the "Bid Now" button
        listingDiv.querySelector('.btn-bid').addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent the navigation when clicking "Bid Now"
            const bidAmount = prompt('Enter your bid amount:');
            if (bidAmount && !isNaN(bidAmount) && parseFloat(bidAmount) > listing.currentBid) {
                // Update the current bid and send to WebSocket server
                listing.currentBid = parseFloat(bidAmount);
                socket.send(JSON.stringify({
                    type: 'newBid',
                    propertyName: listing.propertyName,
                    bidAmount: listing.currentBid
                }));
                updateBid({ propertyName: listing.propertyName, bidAmount: listing.currentBid });
            } else {
                alert('Please enter a valid bid amount greater than the current bid.');
            }
        });
    }

    // Function to update bid information
    function updateBid(data) {
        const listingCard = document.querySelector(`.current-bid[data-property="${data.propertyName}"]`);
        if (listingCard) {
            listingCard.textContent = `Current Bid: $${data.bidAmount}`;
        }

        // Update the listing in localStorage if on the detail page
        const listing = JSON.parse(localStorage.getItem('selectedListing'));
        if (listing && listing.propertyName === data.propertyName) {
            listing.currentBid = data.bidAmount;
            localStorage.setItem('selectedListing', JSON.stringify(listing));
            document.getElementById('listing-currentBid').textContent = data.bidAmount;
        }
    }
});
