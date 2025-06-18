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
                this.renderPopularDestinations(destinations);
                this.logger.info(`Loaded ${destinations.length} popular destinations`);
            } else {
                // If no destinations returned, use fallback
                this.logger.warn('No destinations returned from service, using fallback');
                this.renderPopularDestinations(this.getFallbackDestinations());
            }
        } catch (error) {
            this.logger.error('Failed to load popular destinations, using fallback', error);
            // Always load fallback data on error
            this.renderPopularDestinations(this.getFallbackDestinations());
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
                        <button class="btn btn-primary" onclick="TravelApp.exploreLocation('${location.id}')">
                            Explore
                        </button>
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
            const currentItinerary = this.modules.itinerary.getCurrentItinerary();
            if (!currentItinerary) {
                UIManager.showToast('Please create an itinerary first', 'warning');
                return;
            }
            
            // Get item details based on type
            let itemData;
            switch (type) {
                case 'flight':
                    itemData = await this.services.flight.getFlightDetails(itemId);
                    break;
                case 'hotel':
                    itemData = await this.services.hotel.getHotelDetails(itemId);
                    break;
                default:
                    throw new Error(`Unsupported item type: ${type}`);
            }
            
            // Add to first available day and time slot
            const dayIndex = 0;
            const timeSlot = 'morning';
            
            await this.modules.itinerary.addItemToDay(
                currentItinerary.id,
                dayIndex,
                timeSlot,
                {
                    type,
                    title: itemData.name || itemData.title,
                    description: itemData.description,
                    data: itemData
                }
            );
            
            UIManager.showToast(`${type} added to itinerary!`, 'success');
            
        } catch (error) {
            this.handleError('Failed to add item to itinerary', error);
        }
    }

    /**
     * Explore a specific location
     */
    async exploreDestination(locationId) {
        try {
            this.logger.info('Exploring destination', { locationId });
            
            // Get location details
            const locationDetails = await this.services.location.getLocationDetails(locationId);
            
            // Navigate to explore page with location data
            this.modules.navigation.navigateTo('explore', { location: locationDetails });
            
        } catch (error) {
            this.handleError('Failed to explore destination', error);
        }
    }

    /**
     * Render popular destinations on home page
     */
    renderPopularDestinations(destinations) {
        const container = document.getElementById('popular-destinations');
        if (!container) return;

        container.innerHTML = destinations.map(destination => `
            <div class="destination-card" data-destination="${destination.id}">
                <img src="${destination.image}" alt="${destination.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop'">
                <div class="destination-card-content">
                    <h3>${destination.name}</h3>
                    <p>${destination.description}</p>
                    <div class="destination-meta">
                        <span class="rating">★ ${destination.rating}</span>
                        <span class="best-time">${destination.bestTimeToVisit}</span>
                    </div>
                    <button class="btn btn-outline explore-destination-btn" data-destination-id="${destination.id}">
                        Explore
                    </button>
                </div>
            </div>
        `).join('');

        // Add event listeners for explore buttons
        container.querySelectorAll('.explore-destination-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const destinationId = e.target.dataset.destinationId;
                this.exploreDestination(destinationId);
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
                image: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=800&h=600&fit=crop',
                rating: 4.8,
                bestTimeToVisit: 'Apr-Oct',
                highlights: ['Eiffel Tower', 'Louvre Museum', 'Notre-Dame', 'Champs-Élysées']
            },
            {
                id: 'tokyo',
                name: 'Tokyo, Japan',
                description: 'Modern metropolis blending tradition with cutting-edge technology',
                image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=600&fit=crop',
                rating: 4.7,
                bestTimeToVisit: 'Mar-May, Sep-Nov',
                highlights: ['Shibuya Crossing', 'Tokyo Tower', 'Senso-ji Temple', 'Harajuku']
            },
            {
                id: 'newyork',
                name: 'New York City, USA',
                description: 'The Big Apple - bustling city that never sleeps',
                image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=600&fit=crop',
                rating: 4.6,
                bestTimeToVisit: 'Apr-Jun, Sep-Nov',
                highlights: ['Times Square', 'Central Park', 'Statue of Liberty', 'Broadway']
            },
            {
                id: 'london',
                name: 'London, England',
                description: 'Historic capital with royal palaces and modern attractions',
                image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=600&fit=crop',
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
        window.TravelApp.exploreLocation = this.exploreDestination.bind(this);
        
        // Search functionality
        window.TravelApp.performSearch = this.performSearch.bind(this);
        window.TravelApp.handleHeroSearch = this.handleHeroSearch.bind(this);
        
        // Itinerary management
        window.TravelApp.createNewTrip = this.createNewTrip.bind(this);
        window.TravelApp.selectTrip = this.selectTrip.bind(this);
        
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
            
            this.displaySearchResults(results, type);
            
        } catch (error) {
            this.handleError('Search failed', error);
        } finally {
            UIManager.hideLoading();
        }
    }

    /**
     * Create new trip
     */
    async createNewTrip() {
        try {
            // Check if user is authenticated
            if (!this.modules.auth.isAuthenticated()) {
                this.modules.navigation.showAuthModal('login');
                return;
            }
            
            // Create a simple trip for demo
            const tripData = {
                name: `Trip to ${new Date().toLocaleDateString()}`,
                destination: 'New Destination',
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                duration: 7,
                template: 'leisure'
            };
            
            const newTrip = await this.modules.itinerary.createItinerary(tripData);
            
            // Update UI
            this.updateTripsDisplay();
            this.selectTrip(newTrip.id);
            
            UIManager.showToast('New trip created!', 'success');
            
        } catch (error) {
            this.handleError('Failed to create trip', error);
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
        
        builder.innerHTML = `
            <div class="itinerary-header">
                <h2>${trip.name}</h2>
                <p>${trip.destination} • ${trip.duration} days</p>
                <div class="itinerary-actions">
                    <button class="btn btn-outline" onclick="TravelApp.editTrip('${trip.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-secondary" onclick="TravelApp.exportTrip('${trip.id}')">
                        <i class="fas fa-download"></i> Export
                    </button>
                </div>
            </div>
            <div class="itinerary-days">
                ${trip.days.map((day, index) => this.renderDay(day, index, trip.id)).join('')}
            </div>
            <div class="itinerary-footer">
                <button class="btn btn-primary" onclick="TravelApp.addDay('${trip.id}')">
                    <i class="fas fa-plus"></i> Add Day
                </button>
            </div>
        `;
    }

    /**
     * Render a single day in the itinerary
     */
    renderDay(day, dayIndex, tripId) {
        return `
            <div class="day-card" data-day="${dayIndex}">
                <div class="day-header">
                    <h3>Day ${dayIndex + 1}</h3>
                    <span class="day-date">${new Date(day.date).toLocaleDateString()}</span>
                </div>
                <div class="day-content">
                    <div class="time-slots">
                        ${Object.entries(day.timeSlots).map(([slot, items]) => 
                            this.renderTimeSlot(slot, items, dayIndex, tripId)
                        ).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render a time slot
     */
    renderTimeSlot(slot, items, dayIndex, tripId) {
        const slotNames = {
            morning: 'Morning',
            afternoon: 'Afternoon',
            evening: 'Evening',
            night: 'Night'
        };
        
        return `
            <div class="time-slot" data-slot="${slot}">
                <h4>${slotNames[slot]}</h4>
                <div class="slot-items">
                    ${items.map(item => this.renderItineraryItem(item, dayIndex, slot, tripId)).join('')}
                    <button class="btn btn-outline btn-sm add-item-btn" 
                            onclick="TravelApp.showAddItemModal('${tripId}', ${dayIndex}, '${slot}')">
                        <i class="fas fa-plus"></i> Add Item
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render an itinerary item
     */
    renderItineraryItem(item, dayIndex, slot, tripId) {
        return `
            <div class="itinerary-item" data-item-id="${item.id}">
                <div class="item-content">
                    <h5>${item.title}</h5>
                    <p>${item.description}</p>
                    <span class="item-type">${item.type}</span>
                </div>
                <div class="item-actions">
                    <button class="btn btn-sm" onclick="TravelApp.editItem('${tripId}', '${item.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm" onclick="TravelApp.removeItem('${tripId}', '${item.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
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
                    <p>No trips yet</p>
                    <button class="btn btn-primary btn-sm" onclick="TravelApp.createNewTrip()">
                        Create Your First Trip
                    </button>
                </div>
            `;
            return;
        }
        
        tripsList.innerHTML = trips.map(trip => `
            <div class="trip-item ${currentTrip?.id === trip.id ? 'active' : ''}" 
                 onclick="TravelApp.selectTrip('${trip.id}')">
                <h4>${trip.name}</h4>
                <p>${trip.destination}</p>
                <span class="trip-duration">${trip.duration} days</span>
            </div>
        `).join('');
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