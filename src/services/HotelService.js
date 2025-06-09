import { Logger } from '../utils/Logger.js';

/**
 * HotelService - Handles hotel and lodging search operations
 * Integrates with multiple hotel booking APIs
 */
export class HotelService {
    constructor() {
        this.logger = new Logger('HotelService');
        this.cache = new Map();
        this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
        
        // API configurations
        this.apis = {
            amadeus: {
                baseUrl: 'https://test.api.amadeus.com',
                apiKey: process.env.AMADEUS_API_KEY || 'demo-key'
            },
            booking: {
                baseUrl: 'https://distribution-xml.booking.com',
                apiKey: process.env.BOOKING_API_KEY || 'demo-key'
            }
        };
        
        this.logger.info('HotelService initialized');
    }

    /**
     * Search for hotels in a specific location
     * @param {Object} searchParams - Hotel search parameters
     * @param {string} searchParams.location - City or location name
     * @param {string} searchParams.checkIn - Check-in date (YYYY-MM-DD)
     * @param {string} searchParams.checkOut - Check-out date (YYYY-MM-DD)
     * @param {number} searchParams.guests - Number of guests
     * @param {number} searchParams.rooms - Number of rooms
     * @param {Object} searchParams.filters - Search filters
     * @returns {Promise<Array>} Array of hotel options
     */
    async searchHotels(searchParams) {
        try {
            this.logger.info('Searching hotels', { searchParams });
            
            // Check cache first
            const cacheKey = this.generateCacheKey(searchParams);
            const cachedResult = this.getFromCache(cacheKey);
            if (cachedResult) {
                this.logger.info('Returning cached hotel results');
                return cachedResult;
            }

            // Validate search parameters
            this.validateSearchParams(searchParams);

            // For demo purposes, return mock data
            const mockHotels = await this.getMockHotelData(searchParams);
            
            // Apply filters and sorting
            const filteredHotels = this.applyFilters(mockHotels, searchParams.filters || {});
            const sortedHotels = this.sortHotels(filteredHotels, searchParams.sortBy || 'price');
            
            // Cache the results
            this.setCache(cacheKey, sortedHotels);
            
            this.logger.info('Hotel search completed', { 
                resultCount: sortedHotels.length,
                location: searchParams.location
            });
            
            return sortedHotels;
            
        } catch (error) {
            this.logger.error('Hotel search failed', { error: error.message, searchParams });
            throw new Error(`Hotel search failed: ${error.message}`);
        }
    }

    /**
     * Get hotel details by ID
     * @param {string} hotelId - Hotel identifier
     * @returns {Promise<Object>} Hotel details
     */
    async getHotelDetails(hotelId) {
        try {
            this.logger.info('Fetching hotel details', { hotelId });
            
            const mockDetails = await this.getMockHotelDetails(hotelId);
            
            this.logger.info('Hotel details retrieved', { hotelId });
            return mockDetails;
            
        } catch (error) {
            this.logger.error('Failed to get hotel details', { error: error.message, hotelId });
            throw new Error(`Failed to get hotel details: ${error.message}`);
        }
    }

    /**
     * Get hotel reviews and ratings
     * @param {string} hotelId - Hotel identifier
     * @returns {Promise<Object>} Reviews and ratings data
     */
    async getHotelReviews(hotelId) {
        try {
            this.logger.info('Fetching hotel reviews', { hotelId });
            
            const reviews = await this.getMockHotelReviews(hotelId);
            
            this.logger.info('Hotel reviews retrieved', { 
                hotelId, 
                reviewCount: reviews.reviews.length 
            });
            
            return reviews;
            
        } catch (error) {
            this.logger.error('Failed to get hotel reviews', { error: error.message, hotelId });
            throw new Error(`Failed to get hotel reviews: ${error.message}`);
        }
    }

    /**
     * Get nearby attractions for a hotel
     * @param {string} hotelId - Hotel identifier
     * @param {number} radius - Search radius in km
     * @returns {Promise<Array>} Nearby attractions
     */
    async getNearbyAttractions(hotelId, radius = 5) {
        try {
            this.logger.info('Fetching nearby attractions', { hotelId, radius });
            
            const attractions = await this.getMockNearbyAttractions(hotelId, radius);
            
            this.logger.info('Nearby attractions retrieved', { 
                hotelId, 
                attractionCount: attractions.length 
            });
            
            return attractions;
            
        } catch (error) {
            this.logger.error('Failed to get nearby attractions', { error: error.message, hotelId });
            throw new Error(`Failed to get nearby attractions: ${error.message}`);
        }
    }

    /**
     * Validate search parameters
     * @private
     */
    validateSearchParams(params) {
        const required = ['location', 'checkIn', 'checkOut', 'guests'];
        const missing = required.filter(field => !params[field]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required parameters: ${missing.join(', ')}`);
        }

        if (params.guests < 1 || params.guests > 20) {
            throw new Error('Guests must be between 1 and 20');
        }

        // Validate date format and logic
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(params.checkIn)) {
            throw new Error('Invalid check-in date format. Use YYYY-MM-DD');
        }

        if (!dateRegex.test(params.checkOut)) {
            throw new Error('Invalid check-out date format. Use YYYY-MM-DD');
        }

        const checkIn = new Date(params.checkIn);
        const checkOut = new Date(params.checkOut);
        
        if (checkOut <= checkIn) {
            throw new Error('Check-out date must be after check-in date');
        }
    }

    /**
     * Apply filters to hotel results
     * @private
     */
    applyFilters(hotels, filters) {
        return hotels.filter(hotel => {
            // Price range filter
            if (filters.minPrice && hotel.price.amount < filters.minPrice) return false;
            if (filters.maxPrice && hotel.price.amount > filters.maxPrice) return false;
            
            // Star rating filter
            if (filters.minRating && hotel.rating < filters.minRating) return false;
            
            // Amenities filter
            if (filters.amenities && filters.amenities.length > 0) {
                const hasAllAmenities = filters.amenities.every(amenity => 
                    hotel.amenities.includes(amenity)
                );
                if (!hasAllAmenities) return false;
            }
            
            // Property type filter
            if (filters.propertyType && hotel.propertyType !== filters.propertyType) return false;
            
            return true;
        });
    }

    /**
     * Sort hotels by specified criteria
     * @private
     */
    sortHotels(hotels, sortBy) {
        const sortFunctions = {
            price: (a, b) => a.price.amount - b.price.amount,
            rating: (a, b) => b.rating - a.rating,
            distance: (a, b) => a.distanceFromCenter - b.distanceFromCenter,
            name: (a, b) => a.name.localeCompare(b.name)
        };

        return hotels.sort(sortFunctions[sortBy] || sortFunctions.price);
    }

    /**
     * Generate cache key for search parameters
     * @private
     */
    generateCacheKey(params) {
        return `hotel_${params.location}_${params.checkIn}_${params.checkOut}_${params.guests}_${params.rooms || 1}`;
    }

    /**
     * Get data from cache if not expired
     * @private
     */
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }

    /**
     * Set data in cache with timestamp
     * @private
     */
    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Generate mock hotel data for demo purposes
     * @private
     */
    async getMockHotelData(searchParams) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1200));

        const hotelNames = [
            'Grand Plaza Hotel', 'Sunset Resort & Spa', 'City Center Inn', 
            'Oceanview Boutique Hotel', 'Mountain Lodge', 'Urban Suites',
            'Riverside Hotel', 'Downtown Business Hotel', 'Luxury Palace',
            'Cozy B&B Inn'
        ];

        const propertyTypes = ['Hotel', 'Resort', 'Inn', 'Boutique Hotel', 'Lodge', 'Suites'];
        const amenities = [
            'Free WiFi', 'Pool', 'Gym', 'Spa', 'Restaurant', 'Bar',
            'Room Service', 'Concierge', 'Parking', 'Pet Friendly',
            'Business Center', 'Airport Shuttle', 'Breakfast Included'
        ];

        const hotels = [];
        const nights = Math.ceil((new Date(searchParams.checkOut) - new Date(searchParams.checkIn)) / (1000 * 60 * 60 * 24));

        for (let i = 0; i < 8; i++) {
            const basePrice = 80 + Math.random() * 300;
            const totalPrice = Math.round(basePrice * nights);
            
            hotels.push({
                id: `HTL${Date.now()}_${i}`,
                name: hotelNames[i],
                propertyType: propertyTypes[Math.floor(Math.random() * propertyTypes.length)],
                rating: Math.round((3 + Math.random() * 2) * 10) / 10, // 3.0 - 5.0
                reviewCount: Math.floor(Math.random() * 1000) + 50,
                price: {
                    amount: totalPrice,
                    currency: 'USD',
                    perNight: Math.round(basePrice),
                    taxes: Math.round(totalPrice * 0.12)
                },
                location: {
                    address: `${100 + i} Main Street, ${searchParams.location}`,
                    coordinates: {
                        lat: 40.7128 + (Math.random() - 0.5) * 0.1,
                        lng: -74.0060 + (Math.random() - 0.5) * 0.1
                    },
                    distanceFromCenter: Math.round((Math.random() * 5 + 0.5) * 10) / 10
                },
                images: [
                    `https://images.unsplash.com/800x600/?hotel${i}&sig=${i}`,
                    `https://images.unsplash.com/800x600/?room${i}&sig=${i}`,
                    `https://images.unsplash.com/800x600/?lobby${i}&sig=${i}`
                ],
                amenities: amenities.filter(() => Math.random() > 0.4).slice(0, 6),
                rooms: {
                    available: Math.floor(Math.random() * 10) + 1,
                    types: ['Standard Room', 'Deluxe Room', 'Suite'].filter(() => Math.random() > 0.3)
                },
                policies: {
                    checkIn: '3:00 PM',
                    checkOut: '11:00 AM',
                    cancellation: Math.random() > 0.5 ? 'Free cancellation' : 'Non-refundable',
                    pets: Math.random() > 0.7 ? 'Pets allowed' : 'No pets'
                },
                bookingUrl: `https://example.com/book-hotel/${Date.now()}_${i}`,
                description: `Experience comfort and luxury at ${hotelNames[i]}. Perfect for both business and leisure travelers.`
            });
        }

        return hotels;
    }

    /**
     * Generate mock hotel details
     * @private
     */
    async getMockHotelDetails(hotelId) {
        await new Promise(resolve => setTimeout(resolve, 600));

        return {
            id: hotelId,
            facilities: [
                'Outdoor Pool', 'Fitness Center', 'Business Center', 'Restaurant',
                'Bar/Lounge', 'Room Service', '24-hour Front Desk', 'Concierge'
            ],
            roomTypes: [
                {
                    type: 'Standard Room',
                    size: '25 sqm',
                    beds: '1 Queen Bed',
                    maxOccupancy: 2,
                    amenities: ['Free WiFi', 'Air Conditioning', 'TV', 'Mini Fridge']
                },
                {
                    type: 'Deluxe Room',
                    size: '35 sqm',
                    beds: '1 King Bed',
                    maxOccupancy: 2,
                    amenities: ['Free WiFi', 'Air Conditioning', 'TV', 'Mini Fridge', 'Coffee Maker', 'Balcony']
                }
            ],
            nearbyAttractions: [
                { name: 'City Museum', distance: '0.5 km' },
                { name: 'Central Park', distance: '1.2 km' },
                { name: 'Shopping District', distance: '0.8 km' }
            ],
            transportation: {
                airport: '25 minutes by car',
                publicTransport: 'Metro station 200m away',
                parking: 'On-site parking available ($15/night)'
            }
        };
    }

    /**
     * Generate mock hotel reviews
     * @private
     */
    async getMockHotelReviews(hotelId) {
        await new Promise(resolve => setTimeout(resolve, 400));

        const reviewTexts = [
            'Excellent service and beautiful rooms. Highly recommended!',
            'Great location, walking distance to major attractions.',
            'Clean, comfortable, and staff was very helpful.',
            'Good value for money. Would stay again.',
            'Beautiful hotel with amazing amenities.'
        ];

        const reviews = [];
        for (let i = 0; i < 5; i++) {
            reviews.push({
                id: `REV${Date.now()}_${i}`,
                rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
                title: `Great Stay ${i + 1}`,
                text: reviewTexts[i],
                author: `Guest${i + 1}`,
                date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                helpful: Math.floor(Math.random() * 20)
            });
        }

        return {
            averageRating: 4.2,
            totalReviews: 156,
            ratingBreakdown: {
                5: 78,
                4: 45,
                3: 23,
                2: 7,
                1: 3
            },
            reviews
        };
    }

    /**
     * Generate mock nearby attractions
     * @private
     */
    async getMockNearbyAttractions(hotelId, radius) {
        await new Promise(resolve => setTimeout(resolve, 300));

        const attractions = [
            { name: 'Historic Downtown', type: 'Historic Site', distance: 0.8 },
            { name: 'Art Museum', type: 'Museum', distance: 1.2 },
            { name: 'Waterfront Park', type: 'Park', distance: 0.5 },
            { name: 'Shopping Center', type: 'Shopping', distance: 1.5 },
            { name: 'Local Market', type: 'Market', distance: 0.3 }
        ];

        return attractions
            .filter(attraction => attraction.distance <= radius)
            .map(attraction => ({
                ...attraction,
                rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
                image: `https://images.unsplash.com/400x300/?${attraction.type.toLowerCase()}`
            }));
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        this.logger.info('Hotel service cache cleared');
    }
} 