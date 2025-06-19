/**
 * Travel Planner & Explorer - Main Application
 * Author: Travel Explorer Team
 * Description: Main application entry point with modular architecture
 */

// Import core modules
import { NavigationManager } from './modules/NavigationManager.js';
import { AuthenticationManager } from './modules/AuthenticationManager.js';
import { UIManager } from './modules/UIManager.js';
import { StorageManager } from './modules/StorageManager.js';
import { ItineraryManager } from './modules/ItineraryManager.js';
import { Logger } from './utils/Logger.js';

// Import API services
import { FlightService } from './services/FlightService.js';
import { HotelService } from './services/HotelService.js';
import { LocationService } from './services/LocationService.js';
import { MapService } from './services/MapService.js';

/**
 * Main Application Class
 * Coordinates all modules and manages application lifecycle
 */
class TravelPlannerApp {
    constructor() {
        this.logger = new Logger('TravelPlannerApp');
        this.isInitialized = false;
        this.modules = {};
        this.services = {};
        
        // Bind methods
        this.init = this.init.bind(this);
        this.handleError = this.handleError.bind(this);
        this.handleResize = this.handleResize.bind(this);
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            this.logger.info('Initializing Travel Planner Application...');
            
            // Show loading spinner
            UIManager.showLoading();
            
            // Initialize core modules and services
            await this.initializeModules();
            await this.initializeServices();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Load initial data
            await this.loadInitialData();
            
            // Hide loading spinner
            UIManager.hideLoading();
            
            this.isInitialized = true;
            this.logger.info('Application initialized successfully');
            
            // Show welcome toast
            UIManager.showToast('Welcome to Travel Explorer!', 'success');
            
        } catch (error) {
            this.handleError('Failed to initialize application', error);
        }
    }

    /**
     * Initialize all application modules
     */
    async initializeModules() {
        try {
            // Initialize storage first
            this.modules.storage = new StorageManager();
            
            // Initialize UI manager
            this.modules.ui = new UIManager();
            
            // Initialize authentication
            this.modules.auth = new AuthenticationManager(this.modules.storage);
            
            // Initialize navigation
            this.modules.navigation = new NavigationManager();
            
            // Initialize itinerary manager
            this.modules.itinerary = new ItineraryManager();
            
            this.logger.info('Core modules initialized successfully');
            
        } catch (error) {
            throw new Error(`Module initialization failed: ${error.message}`);
        }
    }

    /**
     * Initialize all API services
     */
    async initializeServices() {
        try {
            // Initialize API services
            this.services.flight = new FlightService();
            this.services.hotel = new HotelService();
            this.services.location = new LocationService();
            this.services.map = new MapService();
            
            // Store references globally for module communication
            window.TravelApp = {
                modules: this.modules,
                services: this.services,
                logger: this.logger
            };
            
            // Setup global methods immediately after TravelApp is available
            this.setupGlobalMethods();
            
            this.logger.info('API services initialized successfully');
            
        } catch (error) {
            throw new Error(`Service initialization failed: ${error.message}`);
        }
    }

    /**
     * Set up global event listeners
     */
    setupEventListeners() {
        // Window events
        window.addEventListener('resize', this.handleResize);
        window.addEventListener('error', this.handleError);
        window.addEventListener('unhandledrejection', this.handleError);
        
        // Navigation events
        window.addEventListener('hashchange', () => {
            this.modules.navigation.handleRouteChange();
        });
        
        // Online/offline events
        window.addEventListener('online', () => {
            UIManager.showToast('Connection restored', 'success');
        });
        
        window.addEventListener('offline', () => {
            UIManager.showToast('You are offline', 'warning');
        });

        // Custom application events
        document.addEventListener('mapClick', (e) => {
            this.handleMapClick(e.detail);
        });

        document.addEventListener('searchSubmit', (e) => {
            this.handleSearch(e.detail);
        });

        document.addEventListener('itineraryUpdate', (e) => {
            this.handleItineraryUpdate(e.detail);
        });
        
        // Setup search functionality
        this.setupSearchListeners();
        
        // Setup page-specific listeners
        this.setupPageListeners();
        
        this.logger.info('Event listeners set up successfully');
    }

    /**
     * Setup search event listeners
     */
    setupSearchListeners() {
        // Hero search
        const heroSearchBtn = document.getElementById('hero-search-btn');
        const heroSearchInput = document.getElementById('hero-search');
        
        if (heroSearchBtn) {
            heroSearchBtn.addEventListener('click', () => {
                this.handleHeroSearch();
            });
        }
        
        if (heroSearchInput) {
            heroSearchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleHeroSearch();
                }
            });
        }
        
        // Explore page search
        const exploreSearch = document.getElementById('explore-search');
        if (exploreSearch) {
            exploreSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch(e.target.value, 'locations');
                }
            });
        }
        
        // Map search
        const mapSearch = document.getElementById('map-search');
        if (mapSearch) {
            mapSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchOnMap(e.target.value);
                }
            });
        }
        
        // Category filter
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filterExploreResults(e.target.value);
            });
        }
    }

    /**
     * Setup page-specific event listeners
     */
    setupPageListeners() {
        // New trip button
        const newTripBtn = document.getElementById('new-trip-btn');
        if (newTripBtn) {
            newTripBtn.addEventListener('click', () => {
                this.createNewTrip();
            });
        }
        
        // Map filter buttons
        const mapFilterBtns = document.querySelectorAll('.filter-btn');
        mapFilterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all buttons
                mapFilterBtns.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                e.target.classList.add('active');
                
                // Filter map markers
                const filter = e.target.dataset.filter;
                this.filterMapMarkers(filter);
            });
        });
    }

    /**
     * Load initial application data
     */
    async loadInitialData() {
        try {
            // Load popular destinations for home page
            await this.loadPopularDestinations();
            
            // Load user data if authenticated
            if (this.modules.auth.isAuthenticated()) {
                await this.loadUserData();
            }
            
            // Initialize trips display
            this.updateTripsDisplay();
            
            // Initialize current page
            this.modules.navigation.initializePage();
            
        } catch (error) {
            this.logger.warn('Some initial data failed to load', error);
            // Don't throw - app should still work with cached/default data
        }
    }

    /**
     * Load popular destinations for the home page
     */
    async loadPopularDestinations() {
        try {
            this.logger.info('Loading popular destinations...');
            
            // Use location service to get popular destinations
            const destinations = await this.services.location.searchLocations({
                query: 'popular destinations',
                type: 'city'
            });
            
            // Ensure we have destinations to render
            if (destinations && destinations.length > 0) {
                // Fetch weather data for each destination
                this.logger.info('Fetching weather data for destinations...');
                const destinationsWithWeather = await this.services.location.getWeatherForDestinations(destinations);
                
                // Store popular destinations for "Add to Trip" functionality
                this._lastSearchResults = destinationsWithWeather;
                
                this.renderPopularDestinations(destinationsWithWeather);
                this.logger.info(`Loaded ${destinationsWithWeather.length} popular destinations with weather data`);
            } else {
                // If no destinations returned, use fallback
                this.logger.warn('No destinations returned from service, using fallback');
                const fallbackDestinations = this.getFallbackDestinations();
                const fallbackWithWeather = await this.services.location.getWeatherForDestinations(fallbackDestinations);
                
                // Store fallback destinations for "Add to Trip" functionality
                this._lastSearchResults = fallbackWithWeather;
                
                this.renderPopularDestinations(fallbackWithWeather);
            }
        } catch (error) {
            this.logger.error('Failed to load popular destinations, using fallback', error);
            // Always load fallback data on error
            const fallbackDestinations = this.getFallbackDestinations();
            try {
                const fallbackWithWeather = await this.services.location.getWeatherForDestinations(fallbackDestinations);
                
                // Store fallback destinations for "Add to Trip" functionality
                this._lastSearchResults = fallbackWithWeather;
                
                this.renderPopularDestinations(fallbackWithWeather);
            } catch (weatherError) {
                this.logger.warn('Failed to load weather for fallback destinations', weatherError);
                
                // Store fallback destinations without weather for "Add to Trip" functionality
                this._lastSearchResults = fallbackDestinations;
                
                this.renderPopularDestinations(fallbackDestinations);
            }
        }
    }

    /**
     * Load user-specific data
     */
    async loadUserData() {
        try {
            const userData = this.modules.storage.getUserData();
            if (userData) {
                // Load saved itineraries
                const itineraries = this.modules.itinerary.getAllItineraries();
                
                // Update profile display
                this.updateProfileDisplay(userData);
                
                // Update itinerary count in UI
                this.updateItineraryCount(itineraries.length);
                
                // Update trips display
                this.updateTripsDisplay();
            }
        } catch (error) {
            this.logger.warn('Failed to load user data', error);
        }
    }

    /**
     * Handle map click events
     */
    handleMapClick(detail) {
        try {
            const { coordinates } = detail;
            this.logger.info('Map clicked', { coordinates });
            
            // Get points of interest near clicked location
            this.services.location.getPointsOfInterest({
                lat: coordinates[0],
                lng: coordinates[1],
                radius: 1000,
                category: 'attraction'
            }).then(pois => {
                this.displayNearbyPOIs(pois);
            }).catch(error => {
                this.logger.warn('Failed to get nearby POIs', error);
            });
            
        } catch (error) {
            this.logger.error('Error handling map click', error);
        }
    }

    /**
     * Handle search submissions
     */
    async handleSearch(detail) {
        try {
            const { query, type, filters } = detail;
            this.logger.info('Search submitted', { query, type, filters });
            
            UIManager.showLoading();
            
            let results = [];
            
            switch (type) {
                case 'flights':
                    results = await this.services.flight.searchFlights(filters);
                    break;
                case 'hotels':
                    results = await this.services.hotel.searchHotels(filters);
                    break;
                case 'locations':
                    results = await this.services.location.searchLocations({ query, ...filters });
                    break;
                default:
                    // General search - search locations by default
                    results = await this.services.location.searchLocations({ query });
            }
            
            this.displaySearchResults(results, type);
            UIManager.hideLoading();
            
        } catch (error) {
            UIManager.hideLoading();
            this.handleError('Search failed', error);
        }
    }

    /**
     * Handle itinerary updates
     */
    handleItineraryUpdate(detail) {
        try {
            const { action, itineraryId, data } = detail;
            this.logger.info('Itinerary update', { action, itineraryId });
            
            // Update UI based on action
            switch (action) {
                case 'created':
                    UIManager.showToast('Itinerary created successfully!', 'success');
                    this.modules.navigation.navigateTo('planner');
                    break;
                case 'updated':
                    UIManager.showToast('Itinerary updated', 'success');
                    break;
                case 'deleted':
                    UIManager.showToast('Itinerary deleted', 'info');
                    break;
            }
            
        } catch (error) {
            this.logger.error('Error handling itinerary update', error);
        }
    }

    /**
     * Display search results
     */
    displaySearchResults(results, type) {
        const container = document.getElementById('search-results');
        const exploreContainer = document.getElementById('explore-results');
        
        if (!container) return;
        
        // Show search results container and hide explore results
        container.style.display = 'block';
        if (exploreContainer) {
            exploreContainer.style.display = 'none';
        }
        
        container.innerHTML = `
            <div class="search-results-header">
                <h3>Search Results (${results.length})</h3>
                <div class="search-filters">
                    <!-- Add filter controls here -->
                </div>
            </div>
            <div class="search-results-grid">
                ${results.map(result => this.renderSearchResult(result, type)).join('')}
            </div>
        `;

        // Store last search results for use in exploreLocation
        this._lastSearchResults = results;

        // Add event listeners for location results
        if (type === 'locations') {
            // Handle explore buttons
            container.querySelectorAll('.explore-location-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const locationId = e.target.closest('.explore-location-btn').dataset.locationId;
                    this.exploreLocation(locationId);
                });
            });

            // Handle add to trip buttons
            container.querySelectorAll('.add-to-trip-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const locationId = e.target.closest('.add-to-trip-btn').dataset.locationId;
                    this.addToItinerary('location', locationId);
                });
            });
        }
    }

    /**
     * Render individual search result
     */
    renderSearchResult(result, type) {
        switch (type) {
            case 'flights':
                return this.renderFlightResult(result);
            case 'hotels':
                return this.renderHotelResult(result);
            case 'locations':
                return this.renderLocationResult(result);
            default:
                return this.renderGenericResult(result);
        }
    }

    /**
     * Render flight search result
     */
    renderFlightResult(flight) {
        return `
            <div class="flight-card" data-flight-id="${flight.id}">
                <div class="flight-header">
                    <span class="airline">${flight.airline}</span>
                    <span class="flight-number">${flight.flightNumber}</span>
                </div>
                <div class="flight-route">
                    <div class="departure">
                        <span class="time">${new Date(flight.departure.time).toLocaleTimeString()}</span>
                        <span class="airport">${flight.origin}</span>
                    </div>
                    <div class="flight-duration">
                        <span class="duration">${Math.floor(flight.duration / 60)}h ${flight.duration % 60}m</span>
                        ${flight.stops > 0 ? `<span class="stops">${flight.stops} stop${flight.stops > 1 ? 's' : ''}</span>` : '<span class="direct">Direct</span>'}
                    </div>
                    <div class="arrival">
                        <span class="time">${new Date(flight.arrival.time).toLocaleTimeString()}</span>
                        <span class="airport">${flight.destination}</span>
                    </div>
                </div>
                <div class="flight-footer">
                    <span class="price">$${flight.price.amount}</span>
                    <button class="btn btn-primary" onclick="TravelApp.addToItinerary('flight', '${flight.id}')">
                        Add to Trip
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render hotel search result
     */
    renderHotelResult(hotel) {
        return `
            <div class="hotel-card" data-hotel-id="${hotel.id}">
                <img src="${hotel.images[0]}" alt="${hotel.name}" class="hotel-image">
                <div class="hotel-content">
                    <div class="hotel-header">
                        <h4>${hotel.name}</h4>
                        <div class="hotel-rating">
                            <span class="stars">${'★'.repeat(Math.floor(hotel.rating))}</span>
                            <span class="rating">${hotel.rating}</span>
                            <span class="reviews">(${hotel.reviewCount} reviews)</span>
                        </div>
                    </div>
                    <p class="hotel-location">${hotel.location.address}</p>
                    <div class="hotel-amenities">
                        ${hotel.amenities.slice(0, 3).map(amenity => `<span class="amenity">${amenity}</span>`).join('')}
                    </div>
                    <div class="hotel-footer">
                        <div class="price">
                            <span class="amount">$${hotel.price.amount}</span>
                            <span class="period">total</span>
                        </div>
                        <button class="btn btn-primary" onclick="TravelApp.addToItinerary('hotel', '${hotel.id}')">
                            Add to Trip
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render location search result
     */
    renderLocationResult(location) {
        return `
            <div class="location-card" data-location-id="${location.id}">
                <img src="${location.image}" alt="${location.name}" class="location-image">
                <div class="location-content">
                    <h4>${location.name}</h4>
                    <p class="location-type">${location.type}</p>
                    <p class="location-description">${location.description}</p>
                    <div class="location-highlights">
                        ${location.highlights.slice(0, 3).map(highlight => `<span class="highlight">${highlight}</span>`).join('')}
                    </div>
                    <div class="location-footer">
                        <div class="rating">
                            <span class="stars">★</span>
                            <span>${location.rating}</span>
                        </div>
                        <div class="location-actions">
                            <button class="btn btn-outline explore-location-btn" data-location-id="${location.id}">
                                <i class="fas fa-eye"></i>
                                Explore
                            </button>
                            <button class="btn btn-primary add-to-trip-btn" data-location-id="${location.id}">
                                <i class="fas fa-plus"></i>
                                Add to Trip
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render generic search result
     */
    renderGenericResult(result) {
        return `
            <div class="result-card" data-result-id="${result.id}">
                <h4>${result.name || result.title}</h4>
                <p>${result.description}</p>
            </div>
        `;
    }

    /**
     * Display nearby points of interest
     */
    displayNearbyPOIs(pois) {
        const container = document.getElementById('nearby-pois');
        if (!container) return;
        
        container.innerHTML = `
            <h4>Nearby Points of Interest</h4>
            <div class="poi-list">
                ${pois.map(poi => `
                    <div class="poi-item" data-poi-id="${poi.id}">
                        <h5>${poi.name}</h5>
                        <p>${poi.type} • ${poi.distance}m away</p>
                        <div class="poi-rating">★ ${poi.rating}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Add item to current itinerary
     */
    async addToItinerary(type, itemId) {
        try {
            UIManager.showLoading('Adding to trip...');
            
            let currentItinerary = this.modules.itinerary.getCurrentItinerary();
            
            // If no current itinerary, show trip creation modal
            if (!currentItinerary) {
                this.logger.info('No current itinerary found, showing trip creation modal');
                UIManager.hideLoading();
                
                // Store the item details for later use after trip creation
                this._pendingAddToTrip = { type, itemId };
                
                // Show trip creation modal
                this.showTripCreationModal();
                return;
            }
            
            // Continue with adding item to existing trip
            await this.addItemToExistingTrip(type, itemId, currentItinerary);
            
        } catch (error) {
            UIManager.hideLoading();
            this.handleError('Failed to add item to trip', error);
            UIManager.showToast('Failed to add item to trip. Please try again.', 'error');
        }
    }

    /**
     * Add item to an existing trip
     */
    async addItemToExistingTrip(type, itemId, currentItinerary) {
        let itemData = null;
        
        if (type === 'location') {
            // First try to get from search results
            itemData = this._lastSearchResults?.find(result => 
                result.id === itemId || result.place_id === itemId
            );
            
            if (!itemData) {
                // Fallback to API call if not in search results
                this.logger.info('Location not found in search results, fetching from API', { itemId });
                try {
                    const response = await this.modules.api.searchLocation(itemId);
                    if (response?.results?.[0]) {
                        itemData = response.results[0];
                    }
                } catch (apiError) {
                    this.logger.error('Failed to fetch location from API', apiError);
                    throw new Error('Location not found');
                }
            }
            
            if (!itemData) {
                throw new Error('Location data not available');
            }
            
            // Check if this is the first location being added to the trip
            const isFirstLocation = this.isFirstLocationInTrip(currentItinerary);
            
            // If this is the first location and trip has a generic destination, update it
            if (isFirstLocation && this.hasGenericDestination(currentItinerary)) {
                await this.updateTripDestination(currentItinerary.id, itemData);
            }
            
            // Convert location data to itinerary item format
            const itineraryItem = {
                title: itemData.name || itemData.title,
                description: itemData.description || itemData.vicinity || '',
                type: 'location',
                category: 'attraction',
                data: itemData,
                cost: 0,
                duration: '2 hours'
            };
            
            // Add to the first available time slot of the first day
            const firstDay = currentItinerary.days[0];
            const availableSlot = this.findAvailableTimeSlot(firstDay);
        
        await this.modules.itinerary.addItemToDay(
            currentItinerary.id,
                0, 
                availableSlot, 
                itineraryItem
            );
            
        } else if (type === 'flight') {
            // Handle flight booking
            itemData = this.getFlightData(itemId);
            if (!itemData) {
                throw new Error('Flight data not available');
            }
            
            const itineraryItem = {
                title: `${itemData.airline} ${itemData.flightNumber}`,
                description: `${itemData.departure} to ${itemData.arrival}`,
                type: 'flight',
                category: 'transport',
                data: itemData,
                cost: itemData.price || 0,
                duration: itemData.duration || '2 hours'
            };
            
            // Add to the first day, morning slot
            await this.modules.itinerary.addItemToDay(
                currentItinerary.id, 
                0, 
                'morning', 
                itineraryItem
            );
            
        } else if (type === 'hotel') {
            // Handle hotel booking
            itemData = this.getHotelData(itemId);
            if (!itemData) {
                throw new Error('Hotel data not available');
            }
            
            const itineraryItem = {
                title: itemData.name,
                description: itemData.description || itemData.address,
                type: 'hotel',
                category: 'accommodation',
                data: itemData,
                cost: itemData.pricePerNight || 0,
                duration: 'All day'
            };
            
            // Add to the first day, evening slot
            await this.modules.itinerary.addItemToDay(
                currentItinerary.id, 
                0, 
                'evening', 
                itineraryItem
            );
            
        } else {
            throw new Error(`Unsupported item type: ${type}`);
        }
        
        // Update UI
        this.selectTrip(currentItinerary.id);
        this.updateTripsDisplay();
        
        UIManager.hideLoading();
        UIManager.showToast(`${itemData.name || itemData.title} added to your trip!`, 'success');
    }
    
    /**
     * Check if this is the first location being added to the trip
     */
    isFirstLocationInTrip(trip) {
        for (const day of trip.days) {
            for (const timeSlot of Object.values(day.timeSlots)) {
                const locationItems = timeSlot.items?.filter(item => 
                    item.type === 'location' || item.category === 'attraction'
                ) || [];
                if (locationItems.length > 0) {
                    return false;
                }
            }
        }
        return true;
    }
    
    /**
     * Check if trip has a generic destination name
     */
    hasGenericDestination(trip) {
        const genericNames = [
            'Multiple Destinations',
            'New Destination', 
            'Unknown Destination',
            'Destination'
        ];
        return genericNames.includes(trip.destination);
    }
    
    /**
     * Update trip destination based on location data
     */
    async updateTripDestination(tripId, locationData) {
        try {
            const trip = this.modules.itinerary.getItinerary(tripId);
            if (!trip) return;
            
            // Extract destination from location data
            let destination = 'Unknown Destination';
            
            if (locationData.vicinity) {
                // Extract city from vicinity (e.g., "Downtown, New York, NY" -> "New York")
                const parts = locationData.vicinity.split(',').map(p => p.trim());
                destination = parts.length > 1 ? parts[parts.length - 2] : parts[0];
            } else if (locationData.formatted_address) {
                // Extract city from formatted address
                const parts = locationData.formatted_address.split(',').map(p => p.trim());
                destination = parts.length > 1 ? parts[parts.length - 3] || parts[parts.length - 2] : parts[0];
            } else if (locationData.name) {
                // Use location name as fallback
                destination = locationData.name;
            }
            
            // Update the trip destination
            trip.destination = destination;
            trip.title = `Trip to ${destination}`;
            trip.name = `Trip to ${destination}`;
            trip.updatedAt = new Date().toISOString();
            
            // Save the updated trip
            await this.modules.itinerary.saveItineraries();
            
            this.logger.info('Updated trip destination', { tripId, destination });
            
        } catch (error) {
            this.logger.error('Failed to update trip destination', error);
        }
    }
    
    /**
     * Find the first available time slot in a day
     */
    findAvailableTimeSlot(day) {
        const slots = ['morning', 'afternoon', 'evening'];
        for (const slot of slots) {
            if (day.timeSlots[slot] && (!day.timeSlots[slot].items || day.timeSlots[slot].items.length === 0)) {
                return slot;
            }
        }
        return 'morning'; // Default to morning if all slots have items
    }

    /**
     * Explore a specific destination (from destination cards)
     */
    async exploreDestination(locationId) {
        try {
            this.logger.info('Exploring destination', { locationId });
            
            // Try to get location details from stored popular destinations first
            let locationDetails = null;
            
            // Check if we have the destination in our stored search results
            if (this._lastSearchResults) {
                locationDetails = this._lastSearchResults.find(dest => 
                    dest.id === locationId || dest.place_id === locationId
                );
            }
            
            // If not found in search results, try to get from API
            if (!locationDetails) {
                this.logger.info('Destination not found in stored results, fetching from API', { locationId });
                locationDetails = await this.services.location.getLocationDetails(locationId);
            }
            
            if (!locationDetails) {
                throw new Error('Destination details not found');
            }
            
            this.logger.info('Found destination details', { 
                name: locationDetails.name, 
                hasDescription: !!locationDetails.description 
            });
            
            // Navigate to explore page with location data
            this.modules.navigation.navigateTo('explore', { location: locationDetails });
            
        } catch (error) {
            this.handleError('Failed to explore destination', error);
            UIManager.showToast('Failed to load destination details. Please try again.', 'error');
        }
    }

    /**
     * Explore a specific location (from search results)
     */
    async exploreLocation(locationId) {
        try {
            this.logger.info('Exploring location', { locationId });
            
            // Show loading state
            UIManager.showLoading();
            
            // Try to get the basic info from the last search results if available
            let basicInfo = null;
            const lastResults = this._lastSearchResults || [];
            basicInfo = lastResults.find(loc => loc.id === locationId) || null;
            
            this.logger.debug('Basic info found', { basicInfo: !!basicInfo, locationId });
            
            // Fetch full details for the location, merging basic info
            const locationDetails = await this.services.location.getLocationDetails(locationId, basicInfo);
            
            this.logger.info('Location details retrieved', { locationId, hasDetails: !!locationDetails });
            
            // Navigate to Explore page with only this location's details
            this.modules.navigation.navigateTo('explore', { location: locationDetails });
            
            // Ensure only the explore-results section is visible
            setTimeout(() => {
                const exploreResults = document.getElementById('explore-results');
                const searchResults = document.getElementById('search-results');
                
                if (exploreResults) {
                    exploreResults.style.display = 'block';
                    this.logger.debug('Explore results container shown');
                }
                if (searchResults) {
                    searchResults.style.display = 'none';
                    this.logger.debug('Search results container hidden');
                }
                
                UIManager.hideLoading();
            }, 100);
            
        } catch (error) {
            this.logger.error('Failed to load location details', { error: error.message, locationId });
            UIManager.hideLoading();
            this.handleError('Failed to load location details', error);
        }
    }

    /**
     * Render popular destinations on home page
     */
    renderPopularDestinations(destinations) {
        const container = document.getElementById('popular-destinations');
        if (!container) return;

        container.innerHTML = destinations.map(destination => {
            // Render weather info if available
            const weatherHtml = destination.weather ? `
                <div class="destination-weather">
                    <div class="weather-main">
                        <img src="${destination.weather.icon}" alt="${destination.weather.condition}" class="weather-icon" onerror="this.style.display='none'">
                        <span class="temperature">${destination.weather.temperature}°C</span>
                    </div>
                    <div class="weather-condition">${destination.weather.condition}</div>
                </div>
            ` : '';

            return `
            <div class="destination-card" data-destination="${destination.id}">
                    <div class="destination-image-container">
                        <img src="${destination.image}" alt="${destination.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&crop=entropy&auto=format'">
                        ${weatherHtml}
                    </div>
                <div class="destination-card-content">
                    <h3>${destination.name}</h3>
                    <p>${destination.description}</p>
                    <div class="destination-meta">
                        <span class="rating">★ ${destination.rating}</span>
                        <span class="best-time">${destination.bestTimeToVisit}</span>
                    </div>
                        <div class="destination-highlights">
                            ${destination.highlights ? destination.highlights.slice(0, 3).map(highlight => 
                                `<span class="highlight-tag">${highlight}</span>`
                            ).join('') : ''}
                        </div>
                    <div class="destination-actions">
                        <button class="btn btn-outline explore-destination-btn" data-destination-id="${destination.id}">
                                <i class="fas fa-eye"></i>
                            Explore
                        </button>
                        <button class="btn btn-primary add-to-trip-btn" data-destination-id="${destination.id}">
                            <i class="fas fa-plus"></i>
                            Add to Trip
                        </button>
                    </div>
                </div>
            </div>
            `;
        }).join('');

        // Add event listeners for explore buttons
        container.querySelectorAll('.explore-destination-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const destinationId = e.target.closest('.explore-destination-btn').dataset.destinationId;
                this.exploreDestination(destinationId);
            });
        });

        // Add event listeners for add to trip buttons
        container.querySelectorAll('.add-to-trip-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const destinationId = e.target.closest('.add-to-trip-btn').dataset.destinationId;
                this.addToItinerary('location', destinationId);
            });
        });
    }

    /**
     * Update profile display with user data
     */
    updateProfileDisplay(userData) {
        const profileElements = document.querySelectorAll('[data-user-info]');
        profileElements.forEach(element => {
            const field = element.dataset.userInfo;
            if (userData[field]) {
                element.textContent = userData[field];
            }
        });
    }

    /**
     * Update itinerary count in UI
     */
    updateItineraryCount(count) {
        const countElements = document.querySelectorAll('[data-itinerary-count]');
        countElements.forEach(element => {
            element.textContent = count;
        });
    }

    /**
     * Get fallback destinations when API fails
     */
    getFallbackDestinations() {
        return [
            {
                id: 'paris',
                name: 'Paris, France',
                description: 'The City of Light with iconic landmarks and rich culture',
                image: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=800&h=600&fit=crop&crop=entropy&auto=format',
                rating: 4.8,
                bestTimeToVisit: 'Apr-Oct',
                highlights: ['Eiffel Tower', 'Louvre Museum', 'Notre-Dame', 'Champs-Élysées']
            },
            {
                id: 'tokyo',
                name: 'Tokyo, Japan',
                description: 'Modern metropolis blending tradition with cutting-edge technology',
                image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=600&fit=crop&crop=entropy&auto=format',
                rating: 4.7,
                bestTimeToVisit: 'Mar-May, Sep-Nov',
                highlights: ['Shibuya Crossing', 'Tokyo Tower', 'Senso-ji Temple', 'Harajuku']
            },
            {
                id: 'newyork',
                name: 'New York City, USA',
                description: 'The Big Apple - bustling city that never sleeps',
                image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=600&fit=crop&crop=entropy&auto=format',
                rating: 4.6,
                bestTimeToVisit: 'Apr-Jun, Sep-Nov',
                highlights: ['Times Square', 'Central Park', 'Statue of Liberty', 'Broadway']
            },
            {
                id: 'london',
                name: 'London, England',
                description: 'Historic capital with royal palaces and modern attractions',
                image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=600&fit=crop&crop=entropy&auto=format',
                rating: 4.5,
                bestTimeToVisit: 'May-Sep',
                highlights: ['Big Ben', 'Tower Bridge', 'British Museum', 'Buckingham Palace']
            }
        ];
    }

    /**
     * Handle application errors
     */
    handleError(message, error) {
        this.logger.error(message, error);
        
        // Hide loading if active
        UIManager.hideLoading();
        
        // Show user-friendly error message
        const userMessage = this.getUserFriendlyErrorMessage(error);
        UIManager.showToast(userMessage, 'error');
        
        // Report error for monitoring (in production)
        this.reportError(error);
    }

    /**
     * Get user-friendly error message
     */
    getUserFriendlyErrorMessage(error) {
        if (!error) return 'An unexpected error occurred';
        
        const message = error.message || error.toString();
        
        // Map technical errors to user-friendly messages
        if (message.includes('network') || message.includes('fetch')) {
            return 'Network error. Please check your connection and try again.';
        }
        
        if (message.includes('unauthorized') || message.includes('authentication')) {
            return 'Please log in to continue.';
        }
        
        if (message.includes('not found')) {
            return 'The requested information could not be found.';
        }
        
        return 'Something went wrong. Please try again.';
    }

    /**
     * Report error for monitoring
     */
    reportError(error) {
        // In production, send to error monitoring service
        console.error('Error reported:', error);
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Debounce resize events
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            // Notify modules that need to handle resize
            if (this.services.map && this.services.map.map) {
                this.services.map.map.invalidateSize();
            }
            
            // Update UI layouts
            this.modules.ui.handleResize();
        }, 250);
    }

    /**
     * Clean up and destroy the application
     */
    destroy() {
        try {
            // Remove event listeners
            window.removeEventListener('resize', this.handleResize);
            window.removeEventListener('error', this.handleError);
            window.removeEventListener('unhandledrejection', this.handleError);
            
            // Destroy services
            if (this.services.map) {
                this.services.map.destroy();
            }
            
            // Clear global reference
            delete window.TravelApp;
            
            this.isInitialized = false;
            this.logger.info('Application destroyed');
            
        } catch (error) {
            this.logger.error('Error during application destruction', error);
        }
    }

    /**
     * Setup global methods for HTML onclick handlers
     */
    setupGlobalMethods() {
        // Make methods available globally for HTML onclick handlers
        window.TravelApp.addToItinerary = this.addToItinerary.bind(this);
        window.TravelApp.exploreDestination = this.exploreDestination.bind(this);
        window.TravelApp.exploreLocation = this.exploreLocation.bind(this);
        
        // Search functionality
        window.TravelApp.performSearch = this.performSearch.bind(this);
        window.TravelApp.handleHeroSearch = this.handleHeroSearch.bind(this);
        window.TravelApp.viewAllResults = this.viewAllResults.bind(this);
        
        // Itinerary management
        window.TravelApp.createNewTrip = this.createNewTrip.bind(this);
        window.TravelApp.selectTrip = this.selectTrip.bind(this);
        window.TravelApp.deleteTrip = this.deleteTrip.bind(this);
        window.TravelApp.closeTripCreationModal = this.closeTripCreationModal.bind(this);
        
        // Itinerary item management
        window.TravelApp.showAddItemModal = this.showAddItemModal.bind(this);
        window.TravelApp.editItem = this.editItem.bind(this);
        window.TravelApp.removeItem = this.removeItem.bind(this);
        window.TravelApp.editTrip = this.editTrip.bind(this);
        window.TravelApp.exportTrip = this.exportTrip.bind(this);
        window.TravelApp.addDay = this.addDay.bind(this);
        
        // Map functionality
        window.TravelApp.initializeMap = this.initializeMap.bind(this);
        
        this.logger.info('Global methods setup complete');
    }

    /**
     * Handle hero search from home page
     */
    async handleHeroSearch() {
        const searchInput = document.getElementById('hero-search');
        if (!searchInput || !searchInput.value.trim()) {
            UIManager.showToast('Please enter a destination to search', 'warning');
            return;
        }
        
        const query = searchInput.value.trim();
        this.logger.info('Hero search initiated', { query });
        
        try {
            UIManager.showLoading();
            
            // Perform search for destinations
            const results = await this.services.location.searchLocations({ query });
            
            if (results && results.length > 0) {
                // Show results on home page first
                this.displayHeroSearchResults(results, query);
                UIManager.showToast(`Found ${results.length} results for "${query}"`, 'success');
            } else {
                UIManager.showToast('No destinations found. Try a different search term.', 'info');
            }
        } catch (error) {
            this.handleError('Search failed', error);
        } finally {
            UIManager.hideLoading();
        }
    }

    /**
     * Display hero search results on home page
     */
    displayHeroSearchResults(results, query) {
        // Store search results for later reference
        this._lastSearchResults = results;
        
        // Create or update search results section on home page
        let resultsSection = document.getElementById('hero-search-results');
        
        if (!resultsSection) {
            // Create results section if it doesn't exist
            const featuredSection = document.querySelector('.featured-section');
            if (featuredSection) {
                resultsSection = document.createElement('section');
                resultsSection.id = 'hero-search-results';
                resultsSection.className = 'search-results-section';
                featuredSection.parentNode.insertBefore(resultsSection, featuredSection);
            }
        }
        
        if (resultsSection) {
            resultsSection.innerHTML = `
                <div class="container">
                    <div class="search-results-header">
                        <h2>Search Results for "${query}"</h2>
                        <p>Found ${results.length} destinations</p>
                        <button class="btn btn-outline" onclick="TravelApp.viewAllResults('${query}')">
                            <i class="fas fa-search-plus"></i>
                            View All in Explore
                        </button>
                    </div>
                    <div class="destination-grid">
                        ${results.slice(0, 6).map(result => this.renderDestinationCard(result)).join('')}
                    </div>
                </div>
            `;
            
            // Add event listeners for explore buttons in search results
            // Use exploreLocation for search results instead of exploreDestination
            resultsSection.querySelectorAll('.explore-destination-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const destinationId = e.target.closest('.explore-destination-btn').dataset.destinationId;
                    this.logger.info('Exploring location from homepage search', { destinationId });
                    this.exploreLocation(destinationId);
                });
            });

            // Add event listeners for add to trip buttons
            resultsSection.querySelectorAll('.add-to-trip-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const destinationId = e.target.closest('.add-to-trip-btn').dataset.destinationId;
                    this.addToItinerary('location', destinationId);
                });
            });
            
            // Scroll to results
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    /**
     * Render destination card for search results
     */
    renderDestinationCard(destination) {
        return `
            <div class="destination-card" data-destination="${destination.id}">
                <img src="${destination.image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&crop=entropy&auto=format'}" 
                     alt="${destination.name}" 
                     loading="lazy" 
                     onerror="this.src='https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&crop=entropy&auto=format'">
                <div class="destination-card-content">
                    <h3>${destination.name}</h3>
                    <p>${destination.description || 'Discover this amazing destination'}</p>
                    <div class="destination-meta">
                        <span class="rating">★ ${destination.rating || '4.5'}</span>
                        <span class="best-time">${destination.bestTimeToVisit || 'Year-round'}</span>
                    </div>
                    <div class="destination-actions">
                        <button class="btn btn-outline explore-destination-btn" data-destination-id="${destination.id}">
                            <i class="fas fa-eye"></i>
                            Explore
                        </button>
                        <button class="btn btn-primary add-to-trip-btn" data-destination-id="${destination.id}">
                            <i class="fas fa-plus"></i>
                            Add to Trip
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * View all search results in explore page
     */
    async viewAllResults(query) {
        // Navigate to explore page
        this.modules.navigation.navigateTo('explore');
        
        // Set the search input and perform search
        const exploreSearch = document.getElementById('explore-search');
        if (exploreSearch) {
            exploreSearch.value = query;
        }
        
        // Perform search on explore page
        await this.performSearch(query, 'locations');
    }

    /**
     * Perform search
     */
    async performSearch(query, type = 'locations') {
        try {
            this.logger.info('Performing search', { query, type });
            
            UIManager.showLoading();
            
            let results = [];
            
            switch (type) {
                case 'flights':
                    // For flight search, we need more parameters
                    UIManager.showToast('Please use the flight search form for detailed flight searches', 'info');
                    break;
                case 'hotels':
                    results = await this.services.hotel.searchHotels({ destination: query });
                    break;
                case 'locations':
                default:
                    results = await this.services.location.searchLocations({ query });
                    break;
            }
            
            // Store search results for later reference
            this._lastSearchResults = results;
            
            this.displaySearchResults(results, type);
            
        } catch (error) {
            this.handleError('Search failed', error);
        } finally {
            UIManager.hideLoading();
        }
    }

    /**
     * Create new trip with modal dialog
     */
    async createNewTrip() {
        try {
            this.logger.info('Showing new trip creation modal');
            
            // Show the trip creation modal
            this.showTripCreationModal();
            
        } catch (error) {
            this.handleError('Failed to show trip creation modal', error);
            return null;
        }
    }

    /**
     * Show trip creation modal
     */
    showTripCreationModal() {
        // Create modal HTML
        const modalHtml = `
            <div class="modal trip-creation-modal" id="trip-creation-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Create New Trip</h3>
                        <button class="modal-close" onclick="TravelApp.closeTripCreationModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <form class="trip-creation-form" id="trip-creation-form">
                            <div class="form-group">
                                <label for="trip-destination">Destination City *</label>
                                <input 
                                    type="text" 
                                    id="trip-destination" 
                                    name="destination" 
                                    placeholder="e.g., Paris, Tokyo, New York"
                                    required
                                >
                            </div>
                            
                            <div class="form-group">
                                <label for="trip-name">Trip Name</label>
                                <input 
                                    type="text" 
                                    id="trip-name" 
                                    name="name" 
                                    placeholder="Will be auto-generated if left empty"
                                >
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="trip-start-date">Start Date *</label>
                                    <input 
                                        type="date" 
                                        id="trip-start-date" 
                                        name="startDate" 
                                        required
                                    >
                                </div>
                                <div class="form-group">
                                    <label for="trip-end-date">End Date *</label>
                                    <input 
                                        type="date" 
                                        id="trip-end-date" 
                                        name="endDate" 
                                        required
                                    >
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="trip-type">Trip Type</label>
                                    <select id="trip-type" name="type">
                                        <option value="leisure">Leisure</option>
                                        <option value="business">Business</option>
                                        <option value="adventure">Adventure</option>
                                        <option value="romantic">Romantic</option>
                                        <option value="family">Family</option>
                                        <option value="solo">Solo Travel</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="trip-budget">Budget (Optional)</label>
                                    <input 
                                        type="number" 
                                        id="trip-budget" 
                                        name="budget" 
                                        placeholder="Total budget"
                                        min="0"
                                    >
                                </div>
                            </div>
                            
                            <div class="form-actions">
                                <button type="button" class="btn btn-outline" onclick="TravelApp.closeTripCreationModal()">
                                    Cancel
                                </button>
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-plus"></i>
                                    Create Trip
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Show modal
        const modal = document.getElementById('trip-creation-modal');
        setTimeout(() => modal.classList.add('active'), 10);
        
        // Set default dates
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        document.getElementById('trip-start-date').value = tomorrow.toISOString().split('T')[0];
        document.getElementById('trip-end-date').value = nextWeek.toISOString().split('T')[0];
        
        // Add form submit handler
        document.getElementById('trip-creation-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleTripCreationSubmit(e);
        });
        
        // Focus on destination input
        setTimeout(() => {
            document.getElementById('trip-destination').focus();
        }, 100);
    }

    /**
     * Handle trip creation form submission
     */
    async handleTripCreationSubmit(event) {
        event.preventDefault();
        
        try {
            UIManager.showLoading('Creating your trip...');
            
            // Get form data
            const formData = new FormData(event.target);
            const tripData = {
                title: formData.get('tripName'),
                destination: formData.get('destination'),
                startDate: formData.get('startDate'),
                endDate: formData.get('endDate'),
                type: formData.get('tripType'),
                budget: parseFloat(formData.get('budget')) || 0,
                travelers: parseInt(formData.get('travelers')) || 1,
                notes: formData.get('notes') || ''
            };
            
            this.logger.info('Creating trip with data', { tripData });
            
            // Create the trip
            const newTrip = await this.modules.itinerary.createItinerary(tripData);
            
            if (!newTrip) {
                throw new Error('Failed to create trip');
            }
            
            this.logger.info('Trip created successfully', { tripId: newTrip.id, title: newTrip.title });
            
            // Close the modal
            this.closeTripCreationModal();
            
            // Select the new trip
            this.selectTrip(newTrip.id);
            
            // Update trips display
            this.updateTripsDisplay();
            
            // Navigate to planner page
            this.modules.navigation.navigateTo('planner');
            
            UIManager.hideLoading();
            UIManager.showToast(`Trip "${newTrip.title}" created successfully!`, 'success');
            
            // If there was a pending add-to-trip request, process it now
            if (this._pendingAddToTrip) {
                this.logger.info('Processing pending add-to-trip request', this._pendingAddToTrip);
                const { type, itemId } = this._pendingAddToTrip;
                this._pendingAddToTrip = null; // Clear the pending request
                
                // Add the item to the newly created trip
                await this.addItemToExistingTrip(type, itemId, newTrip);
            }
            
        } catch (error) {
            UIManager.hideLoading();
            this.logger.error('Failed to create trip', error);
            UIManager.showToast('Failed to create trip. Please try again.', 'error');
        }
    }

    /**
     * Close trip creation modal
     */
    closeTripCreationModal() {
        const modal = document.getElementById('trip-creation-modal');
        if (modal) {
            modal.remove();
        }
        
        // Clear any pending add-to-trip requests
        if (this._pendingAddToTrip) {
            this.logger.info('Clearing pending add-to-trip request due to modal close');
            this._pendingAddToTrip = null;
        }
    }

    /**
     * Select a trip
     */
    selectTrip(tripId) {
        try {
            this.modules.itinerary.setCurrentItinerary(tripId);
            const trip = this.modules.itinerary.getItinerary(tripId);
            
            if (trip) {
                this.displayItinerary(trip);
                this.updateTripsDisplay();
            }
            
        } catch (error) {
            this.handleError('Failed to select trip', error);
        }
    }

    /**
     * Display itinerary in the builder
     */
    displayItinerary(trip) {
        const builder = document.getElementById('itinerary-builder');
        if (!builder) return;
        
        // Calculate trip statistics
        const totalItems = trip.days.reduce((total, day) => {
            return total + Object.values(day.timeSlots).reduce((dayTotal, slot) => {
                return dayTotal + (slot.items ? slot.items.length : 0);
            }, 0);
        }, 0);
        
        const startDate = new Date(trip.startDate);
        const endDate = new Date(trip.endDate);
        const isUpcoming = startDate > new Date();
        const isActive = startDate <= new Date() && endDate >= new Date();
        const isPast = endDate < new Date();
        
        let statusClass = '';
        let statusText = '';
        let statusIcon = '';
        
        if (isPast) {
            statusClass = 'status-completed';
            statusText = 'Completed';
            statusIcon = 'fas fa-check-circle';
        } else if (isActive) {
            statusClass = 'status-active';
            statusText = 'Active';
            statusIcon = 'fas fa-play-circle';
        } else {
            statusClass = 'status-upcoming';
            statusText = 'Upcoming';
            statusIcon = 'fas fa-calendar-alt';
        }
        
        builder.innerHTML = `
            <div class="itinerary-header">
                <div class="itinerary-title-section">
                    <div class="title-row">
                        <h2>${trip.title || trip.name}</h2>
                        <div class="trip-status-badge ${statusClass}">
                            <i class="${statusIcon}"></i>
                            <span>${statusText}</span>
                        </div>
                    </div>
                    <div class="destination-row">
                        <i class="fas fa-map-marker-alt"></i>
                        <span class="destination">${trip.destination || 'Multiple Destinations'}</span>
                        <div class="trip-type-badge">
                            <i class="fas fa-tag"></i>
                            <span>${trip.type || 'leisure'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="itinerary-stats">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div class="stat-content">
                            <span class="stat-number">${trip.duration}</span>
                            <span class="stat-label">Day${trip.duration !== 1 ? 's' : ''}</span>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-calendar-check"></i>
                        </div>
                        <div class="stat-content">
                            <span class="stat-number">${totalItems}</span>
                            <span class="stat-label">Activities</span>
                        </div>
                    </div>
                    
                    ${trip.budget && trip.budget.total > 0 ? `
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-dollar-sign"></i>
                            </div>
                            <div class="stat-content">
                                <span class="stat-number">$${trip.budget.spent || 0}</span>
                                <span class="stat-label">of $${trip.budget.total}</span>
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-calendar-alt"></i>
                        </div>
                        <div class="stat-content">
                            <span class="stat-number">${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            <span class="stat-label">to ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                    </div>
                </div>
                
                <div class="itinerary-actions">
                    <button class="btn btn-outline" onclick="TravelApp.editTrip('${trip.id}')">
                        <i class="fas fa-edit"></i>
                        <span>Edit Trip</span>
                    </button>
                    <button class="btn btn-secondary" onclick="TravelApp.exportTrip('${trip.id}')">
                        <i class="fas fa-download"></i>
                        <span>Export</span>
                    </button>
                    <button class="btn btn-primary" onclick="TravelApp.addDay('${trip.id}')">
                        <i class="fas fa-plus"></i>
                        <span>Add Day</span>
                    </button>
                </div>
            </div>
            
            <div class="itinerary-content">
                <div class="itinerary-days">
                    ${trip.days.map((day, index) => this.renderDay(day, index, trip.id)).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render a single day in the itinerary
     */
    renderDay(day, dayIndex, tripId) {
        const dayDate = new Date(day.date);
        const isToday = dayDate.toDateString() === new Date().toDateString();
        const isPast = dayDate < new Date() && !isToday;
        const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'long' });
        
        // Calculate day statistics
        const totalItems = Object.values(day.timeSlots).reduce((total, slot) => {
            return total + (slot.items ? slot.items.length : 0);
        }, 0);
        
        return `
            <div class="day-card ${isToday ? 'today' : ''} ${isPast ? 'past' : ''}" data-day="${dayIndex}">
                <div class="day-header">
                    <div class="day-title">
                        <div class="day-number">
                            <span class="day-label">Day</span>
                            <span class="day-value">${dayIndex + 1}</span>
                        </div>
                        <div class="day-info">
                            <h3>${dayName}</h3>
                            <span class="day-date">${dayDate.toLocaleDateString('en-US', { 
                                month: 'long', 
                                day: 'numeric',
                                year: dayDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                            })}</span>
                        </div>
                    </div>
                    <div class="day-stats">
                        <div class="day-stat">
                            <i class="fas fa-tasks"></i>
                            <span>${totalItems} activities</span>
                        </div>
                        ${isToday ? '<div class="today-badge"><i class="fas fa-star"></i><span>Today</span></div>' : ''}
                    </div>
                </div>
                <div class="day-content">
                    <div class="time-slots">
                        ${Object.entries(day.timeSlots).map(([slot, timeSlotObj]) => 
                            this.renderTimeSlot(slot, timeSlotObj, dayIndex, tripId)
                        ).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render a time slot
     */
    renderTimeSlot(slot, timeSlotObj, dayIndex, tripId) {
        const slotNames = {
            morning: 'Morning',
            afternoon: 'Afternoon',
            evening: 'Evening',
            night: 'Night'
        };
        
        const slotIcons = {
            morning: 'fas fa-sun',
            afternoon: 'fas fa-cloud-sun',
            evening: 'fas fa-moon',
            night: 'fas fa-star'
        };
        
        const slotTimes = {
            morning: '6:00 AM - 12:00 PM',
            afternoon: '12:00 PM - 6:00 PM',
            evening: '6:00 PM - 10:00 PM',
            night: '10:00 PM - 6:00 AM'
        };
        
        // Ensure timeSlotObj has the correct structure
        const items = timeSlotObj?.items || [];
        const slotName = slotNames[slot] || timeSlotObj?.name || slot;
        const slotIcon = slotIcons[slot] || 'fas fa-clock';
        const slotTime = slotTimes[slot] || '';
        
        return `
            <div class="time-slot ${items.length === 0 ? 'empty' : ''}" data-slot="${slot}">
                <div class="time-slot-header">
                    <div class="slot-title">
                        <div class="slot-icon">
                            <i class="${slotIcon}"></i>
                        </div>
                        <div class="slot-info">
                            <h4>${slotName}</h4>
                            <span class="slot-time">${slotTime}</span>
                        </div>
                    </div>
                    <div class="slot-meta">
                        <span class="item-count">${items.length} item${items.length !== 1 ? 's' : ''}</span>
                    </div>
                </div>
                <div class="slot-content">
                    <div class="slot-items">
                        ${items.map(item => this.renderItineraryItem(item, dayIndex, slot, tripId)).join('')}
                    </div>
                    <button class="btn btn-outline btn-sm add-item-btn" 
                            onclick="TravelApp.showAddItemModal('${tripId}', ${dayIndex}, '${slot}')">
                        <i class="fas fa-plus"></i>
                        <span>Add Activity</span>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render an itinerary item
     */
    renderItineraryItem(item, dayIndex, slot, tripId) {
        const typeIcons = {
            location: 'fas fa-map-marker-alt',
            attraction: 'fas fa-camera',
            restaurant: 'fas fa-utensils',
            hotel: 'fas fa-bed',
            flight: 'fas fa-plane',
            activity: 'fas fa-hiking',
            shopping: 'fas fa-shopping-bag',
            transport: 'fas fa-car',
            meeting: 'fas fa-handshake',
            entertainment: 'fas fa-music'
        };
        
        const typeColors = {
            location: '#e74c3c',
            attraction: '#3498db',
            restaurant: '#f39c12',
            hotel: '#9b59b6',
            flight: '#1abc9c',
            activity: '#27ae60',
            shopping: '#e67e22',
            transport: '#34495e',
            meeting: '#2c3e50',
            entertainment: '#8e44ad'
        };
        
        const itemIcon = typeIcons[item.type] || typeIcons[item.category] || 'fas fa-map-marker-alt';
        const itemColor = typeColors[item.type] || typeColors[item.category] || '#3498db';
        
        // Format cost if available
        const costDisplay = item.cost && item.cost > 0 ? `
            <div class="item-cost">
                <i class="fas fa-dollar-sign"></i>
                <span>$${item.cost}</span>
            </div>
        ` : '';
        
        // Format duration if available
        const durationDisplay = item.duration ? `
            <div class="item-duration">
                <i class="fas fa-clock"></i>
                <span>${item.duration}</span>
            </div>
        ` : '';
        
        return `
            <div class="itinerary-item" data-item-id="${item.id}">
                <div class="item-indicator" style="background-color: ${itemColor}"></div>
                <div class="item-main">
                    <div class="item-header">
                        <div class="item-title-section">
                            <div class="item-icon" style="color: ${itemColor}">
                                <i class="${itemIcon}"></i>
                            </div>
                            <div class="item-title-info">
                                <h5>${item.title}</h5>
                                <span class="item-type-badge">${item.type || item.category || 'activity'}</span>
                            </div>
                        </div>
                        <div class="item-actions">
                            <button class="btn btn-sm btn-icon" onclick="TravelApp.editItem('${tripId}', '${item.id}')" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-icon btn-danger" onclick="TravelApp.removeItem('${tripId}', '${item.id}')" title="Remove">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    
                    ${item.description ? `
                        <div class="item-description">
                            <p>${item.description}</p>
                        </div>
                    ` : ''}
                    
                    <div class="item-meta">
                        ${costDisplay}
                        ${durationDisplay}
                        ${item.data && item.data.rating ? `
                            <div class="item-rating">
                                <i class="fas fa-star"></i>
                                <span>${item.data.rating}</span>
                            </div>
                        ` : ''}
                        ${item.addedAt ? `
                            <div class="item-added">
                                <i class="fas fa-plus-circle"></i>
                                <span>Added ${new Date(item.addedAt).toLocaleDateString()}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Update trips display
     */
    updateTripsDisplay() {
        const tripsList = document.getElementById('trips-list');
        if (!tripsList) return;
        
        const trips = this.modules.itinerary.getAllItineraries();
        const currentTrip = this.modules.itinerary.getCurrentItinerary();
        
        if (trips.length === 0) {
            tripsList.innerHTML = `
                <div class="empty-trips">
                    <i class="fas fa-map-marked-alt"></i>
                    <h4>No trips yet</h4>
                    <p>Start planning your next adventure!</p>
                    <button class="btn btn-primary btn-sm" onclick="TravelApp.createNewTrip()">
                        <i class="fas fa-plus"></i>
                        Create Your First Trip
                    </button>
                </div>
            `;
            return;
        }
        
        tripsList.innerHTML = trips.map(trip => {
            // Calculate trip progress
            const totalItems = trip.days.reduce((total, day) => {
                return total + Object.values(day.timeSlots).reduce((dayTotal, slot) => {
                    return dayTotal + (slot.items ? slot.items.length : 0);
                }, 0);
            }, 0);
            
            // Format dates
            const startDate = new Date(trip.startDate);
            const endDate = new Date(trip.endDate);
            const isUpcoming = startDate > new Date();
            const isActive = startDate <= new Date() && endDate >= new Date();
            const isPast = endDate < new Date();
            
            let statusClass = '';
            let statusText = '';
            let statusIcon = '';
            
            if (isPast) {
                statusClass = 'status-completed';
                statusText = 'Completed';
                statusIcon = 'fas fa-check-circle';
            } else if (isActive) {
                statusClass = 'status-active';
                statusText = 'Active';
                statusIcon = 'fas fa-play-circle';
            } else {
                statusClass = 'status-upcoming';
                statusText = 'Upcoming';
                statusIcon = 'fas fa-calendar-alt';
            }
            
            return `
                <div class="trip-card ${currentTrip?.id === trip.id ? 'active' : ''}" 
                     data-trip-id="${trip.id}">
                    <div class="trip-card-header">
                        <div class="trip-title">
                            <h4 onclick="TravelApp.selectTrip('${trip.id}')">${trip.title || trip.name}</h4>
                            <div class="trip-status ${statusClass}">
                                <i class="${statusIcon}"></i>
                                <span>${statusText}</span>
                            </div>
                        </div>
                        <div class="trip-actions">
                            <button class="btn btn-sm btn-icon btn-danger" 
                                    onclick="TravelApp.deleteTrip('${trip.id}')" 
                                    title="Delete Trip"
                                    style="z-index: 10; position: relative;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="trip-content" onclick="TravelApp.selectTrip('${trip.id}')">
                        <div class="trip-type">
                            <i class="fas fa-tag"></i>
                            <span>${trip.type || 'leisure'}</span>
                        </div>
                        
                        <div class="trip-destination">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${trip.destination || 'Multiple Destinations'}</span>
                        </div>
                        
                        <div class="trip-details">
                            <div class="trip-duration">
                                <i class="fas fa-clock"></i>
                                <span>${trip.duration} day${trip.duration !== 1 ? 's' : ''}</span>
                            </div>
                            <div class="trip-dates">
                                <i class="fas fa-calendar"></i>
                                <span>${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            </div>
                        </div>
                        
                        <div class="trip-progress">
                            <div class="progress-info">
                                <span class="progress-label">Activities</span>
                                <span class="progress-count">${totalItems} planned</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${Math.min((totalItems / (trip.duration * 2)) * 100, 100)}%"></div>
                            </div>
                        </div>
                        
                        ${trip.budget && trip.budget.total > 0 ? `
                            <div class="trip-budget">
                                <i class="fas fa-dollar-sign"></i>
                                <span>$${trip.budget.spent || 0} / $${trip.budget.total}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Initialize map on map page
     */
    async initializeMap() {
        try {
            if (!this.services.map.map) {
                await this.services.map.initializeMap('map', {
                    center: [40.7128, -74.0060], // New York City
                    zoom: 10
                });
                
                // Add some sample markers
                this.addSampleMapMarkers();
            }
        } catch (error) {
            this.handleError('Failed to initialize map', error);
        }
    }

    /**
     * Add sample markers to the map
     */
    addSampleMapMarkers() {
        const sampleMarkers = [
            {
                id: 'marker1',
                coordinates: [40.7589, -73.9851],
                type: 'attraction',
                title: 'Times Square',
                description: 'Famous commercial intersection and tourist destination'
            },
            {
                id: 'marker2',
                coordinates: [40.7829, -73.9654],
                type: 'attraction',
                title: 'Central Park',
                description: 'Large public park in Manhattan'
            },
            {
                id: 'marker3',
                coordinates: [40.6892, -74.0445],
                type: 'attraction',
                title: 'Statue of Liberty',
                description: 'Iconic symbol of freedom and democracy'
            }
        ];
        
        sampleMarkers.forEach(marker => {
            this.services.map.addMarker(marker);
        });
    }

    /**
     * Search on map
     */
    async searchOnMap(query) {
        try {
            if (!query.trim()) return;
            
            UIManager.showLoading();
            
            // Search for locations
            const locations = await this.services.location.searchLocations({ query });
            
            // Clear existing markers
            this.services.map.clearMarkers();
            
            // Add new markers for search results
            locations.forEach(location => {
                this.services.map.addMarker({
                    id: location.id,
                    coordinates: [location.coordinates.lat, location.coordinates.lng],
                    type: location.type,
                    title: location.name,
                    description: location.description
                });
            });
            
            // Fit map to show all markers
            if (locations.length > 0) {
                this.services.map.fitToMarkers();
            }
            
        } catch (error) {
            this.handleError('Map search failed', error);
        } finally {
            UIManager.hideLoading();
        }
    }

    /**
     * Filter explore results
     */
    async filterExploreResults(category) {
        try {
            const exploreSearch = document.getElementById('explore-search');
            const query = exploreSearch ? exploreSearch.value : '';
            
            const searchParams = { query };
            if (category) {
                searchParams.category = category;
            }
            
            const results = await this.services.location.searchLocations(searchParams);
            this.displaySearchResults(results, 'locations');
            
        } catch (error) {
            this.handleError('Filter failed', error);
        }
    }

    /**
     * Filter map markers
     */
    filterMapMarkers(filter) {
        if (!this.services.map.markers) return;
        
        this.services.map.markers.forEach(marker => {
            const markerData = marker.options.markerData;
            if (filter === 'all' || markerData.type === filter) {
                marker.addTo(this.services.map.map);
            } else {
                this.services.map.map.removeLayer(marker);
            }
        });
    }

    /**
     * Show add item modal (placeholder implementation)
     */
    showAddItemModal(tripId, dayIndex, slot) {
        this.logger.info('Show add item modal', { tripId, dayIndex, slot });
        UIManager.showToast('Add item functionality coming soon!', 'info');
    }

    /**
     * Edit item (placeholder implementation)
     */
    editItem(tripId, itemId) {
        this.logger.info('Edit item', { tripId, itemId });
        UIManager.showToast('Edit item functionality coming soon!', 'info');
    }

    /**
     * Remove item from itinerary
     */
    async removeItem(tripId, itemId) {
        try {
            this.logger.info('Removing item from trip', { tripId, itemId });
            
            await this.modules.itinerary.removeItem(tripId, itemId);
            
            // Update trips display
            this.updateTripsDisplay();
            
            // Refresh the current itinerary display
            const trip = this.modules.itinerary.getItinerary(tripId);
            if (trip) {
                this.displayItinerary(trip);
            }
            
            UIManager.showToast('Item removed from trip', 'success');
            
        } catch (error) {
            this.handleError('Failed to remove item', error);
        }
    }

    /**
     * Edit trip (placeholder implementation)
     */
    editTrip(tripId) {
        this.logger.info('Edit trip', { tripId });
        UIManager.showToast('Edit trip functionality coming soon!', 'info');
    }

    /**
     * Export trip (placeholder implementation)
     */
    exportTrip(tripId) {
        this.logger.info('Export trip', { tripId });
        UIManager.showToast('Export trip functionality coming soon!', 'info');
    }

    /**
     * Add day to trip (placeholder implementation)
     */
    addDay(tripId) {
        this.logger.info('Add day to trip', { tripId });
        UIManager.showToast('Add day functionality coming soon!', 'info');
    }

    /**
     * Delete trip with confirmation
     */
    async deleteTrip(tripId) {
        try {
            this.logger.info('Delete trip requested', { tripId });
            
            // Get trip details for confirmation
            const trip = this.modules.itinerary.getItinerary(tripId);
            if (!trip) {
                UIManager.showToast('Trip not found', 'error');
                return;
            }
            
            // Show confirmation dialog
            const confirmed = confirm(`Are you sure you want to delete "${trip.title || trip.name}"?\n\nThis action cannot be undone.`);
            
            if (!confirmed) {
                this.logger.info('Trip deletion cancelled by user');
                return;
            }
            
            // Delete the trip
            await this.modules.itinerary.deleteItinerary(tripId);
            
            // Update UI
            this.updateTripsDisplay();
            
            // If this was the current trip, clear the itinerary builder
            const currentTrip = this.modules.itinerary.getCurrentItinerary();
            if (!currentTrip || currentTrip.id === tripId) {
                const builder = document.getElementById('itinerary-builder');
                if (builder) {
                    builder.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-calendar-plus"></i>
                            <h3>Start Planning Your Adventure</h3>
                            <p>Create a new trip or select an existing one to begin planning</p>
                        </div>
                    `;
                }
            }
            
            UIManager.showToast(`"${trip.title || trip.name}" has been deleted`, 'success');
            
        } catch (error) {
            this.handleError('Failed to delete trip', error);
            UIManager.showToast('Failed to delete trip. Please try again.', 'error');
        }
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new TravelPlannerApp();
    app.init();
    
    // Store app instance globally for debugging
    window.TravelPlannerApp = app;
});

// Export for module usage
export default TravelPlannerApp; 