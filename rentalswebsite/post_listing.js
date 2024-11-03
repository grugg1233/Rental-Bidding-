document.addEventListener('DOMContentLoaded', () => {
    const listingsContainer = document.getElementById('listings-container');
    const statusElement = document.getElementById('status');
    const listingForm = document.getElementById('listing-form');

    const POLLING_INTERVAL = 5000;

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
                </div>
            </div>
        `;
        listingsContainer.appendChild(listingDiv);
    }

    // Handle form submission
    listingForm.addEventListener('submit', async (event) => {
        event.preventDefault();  // Prevents the page from refreshing

        // Gather form data
        const formData = {
            propertyName: document.getElementById('propertyName').value,
            description: document.getElementById('description').value,
            startingBid: parseFloat(document.getElementById('startingBid').value),
            imgUrl: document.getElementById('imgUrl').value,
            streetAddress: document.getElementById('streetAddress').value,
            city: document.getElementById('city').value,
            state: document.getElementById('state').value,
            postalCode: document.getElementById('postalCode').value,
            currentBid: parseFloat(document.getElementById('startingBid').value)  // Initialize with starting bid
        };

        try {
            // Send the form data to the server
            const response = await fetch('/add-listing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            if (result.success) {
                addListing(result.listing);  // Display the new listing on the page
                listingForm.reset();  // Clear the form after successful submission
                statusElement.textContent = 'Listing added successfully!';
            } else {
                console.error('Error adding listing:', result.message);
                statusElement.textContent = 'Error adding listing.';
            }
        } catch (error) {
            console.error('Error submitting listing:', error);
            statusElement.textContent = 'Failed to add listing.';
        }
    });

    // Load initial listings
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

    // Start by loading initial listings
    loadInitialListings();
});
