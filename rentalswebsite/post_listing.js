document.addEventListener('DOMContentLoaded', () => {
    const listingsContainer = document.getElementById('listings-container');
    const statusElement = document.getElementById('status');
    const POLLING_INTERVAL = 5000;

    // Function to fetch and display initial listings on page load
    async function loadInitialListings() {
        try {
            const response = await fetch('/listings');
            const data = await response.json();
            data.forEach(addListing);
            statusElement.textContent = 'Connected to server';
        } catch (error) {
            console.error('Error loading listings:', error);
            statusElement.textContent = 'Failed to load listings.';
        }
    }

    // Function to poll the server for updates every few seconds
    function pollServerForUpdates() {
        setInterval(async () => {
            try {
                const response = await fetch('/get-updates');  // AJAX call to check for updates
                const data = await response.json();

                data.forEach(update => {
                    if (update.type === 'newListing') {
                        addListing(update.listing);
                    } else if (update.type === 'newBid') {
                        updateBid(update);
                    }
                });
            } catch (error) {
                console.error('Error fetching updates:', error);
            }
        }, POLLING_INTERVAL);
    }

    // Start by loading initial listings and then polling for updates
    loadInitialListings();
    pollServerForUpdates();

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

        // Click event for viewing listing details
        listingDiv.querySelector('.clickable-listing').addEventListener('click', (event) => {
            if (!event.target.classList.contains('btn-bid')) {
                localStorage.setItem('selectedListing', JSON.stringify(listing));
                window.location.href = 'listing_details.html';
            }
        });

        // Click event for bidding
        listingDiv.querySelector('.btn-bid').addEventListener('click', (event) => {
            event.stopPropagation();
            const bidAmount = prompt('Enter your bid amount:');
            if (bidAmount && !isNaN(bidAmount) && parseFloat(bidAmount) > listing.currentBid) {
                listing.currentBid = parseFloat(bidAmount);
                fetch('/newBid', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        propertyName: listing.propertyName,
                        bidAmount: listing.currentBid
                    })
                }).then(response => response.json())
                  .then(data => updateBid(data))
                  .catch(error => console.error('Error posting bid:', error));
            } else {
                alert('Please enter a valid bid amount greater than the current bid.');
            }
        });
    }

    // Function to update bid information in the DOM
    function updateBid(data) {
        const listingCard = document.querySelector(`.current-bid[data-property="${data.propertyName}"]`);
        if (listingCard) {
            listingCard.textContent = `Current Bid: $${data.bidAmount}`;
        }

        const listing = JSON.parse(localStorage.getItem('selectedListing'));
        if (listing && listing.propertyName === data.propertyName) {
            listing.currentBid = data.bidAmount;
            localStorage.setItem('selectedListing', JSON.stringify(listing));
            document.getElementById('listing-currentBid').textContent = data.bidAmount;
        }
    }
});
