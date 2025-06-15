import { Logger } from '../utils/Logger.js';

/**
 * LocationService - Handles location search, points of interest, and geographic data
 * Integrates with multiple location and POI APIs
 */
export class LocationService {
    constructor() {
        this.logger = new Logger('LocationService');
        this.cache = new Map();
        this.cacheTimeout = 15 * 60 * 1000; // 15 minutes
        
        // API configurations
        this.apis = {
            places: {
                baseUrl: 'https://maps.googleapis.com/maps/api/place',
                apiKey: process.env.GOOGLE_PLACES_API_KEY || 'demo-key'
            },
            foursquare: {
                baseUrl: 'https://api.foursquare.com/v3/places',
                apiKey: process.env.FOURSQUARE_API_KEY || 'demo-key'
            },
            openweather: {
                baseUrl: 'https://api.openweathermap.org/data/2.5',
                apiKey: process.env.OPENWEATHER_API_KEY || 'demo-key'
            }
        };
        
        this.logger.info('LocationService initialized');
    }

    /**
     * Search for locations and destinations
     * @param {Object} searchParams - Location search parameters
     * @param {string} searchParams.query - Search query (city, landmark, etc.)
     * @param {Object} searchParams.coordinates - Optional coordinates for nearby search
     * @param {string} searchParams.type - Location type filter
     * @returns {Promise<Array>} Array of location results
     */
    async searchLocations(searchParams) {
        try {
            this.logger.info('Searching locations', { searchParams });
            
            // Check cache first
            const cacheKey = this.generateCacheKey('location', searchParams);
            const cachedResult = this.getFromCache(cacheKey);
            if (cachedResult) {
                this.logger.info('Returning cached location results');
                return cachedResult;
            }

            // Validate search parameters
            this.validateLocationSearchParams(searchParams);

            // For demo purposes, return mock data
            const mockLocations = await this.getMockLocationData(searchParams);
            
            // Cache the results
            this.setCache(cacheKey, mockLocations);
            
            this.logger.info('Location search completed', { 
                resultCount: mockLocations.length,
                query: searchParams.query
            });
            
            return mockLocations;
            
        } catch (error) {
            this.logger.error('Location search failed', { error: error.message, searchParams });
            throw new Error(`Location search failed: ${error.message}`);
        }
    }

    /**
     * Get points of interest near a location
     * @param {Object} params - POI search parameters
     * @param {number} params.lat - Latitude
     * @param {number} params.lng - Longitude
     * @param {number} params.radius - Search radius in meters
     * @param {string} params.category - POI category filter
     * @returns {Promise<Array>} Array of points of interest
     */
    async getPointsOfInterest(params) {
        try {
            this.logger.info('Fetching points of interest', { params });
            
            // Check cache first
            const cacheKey = this.generateCacheKey('poi', params);
            const cachedResult = this.getFromCache(cacheKey);
            if (cachedResult) {
                this.logger.info('Returning cached POI results');
                return cachedResult;
            }

            // Validate parameters
            this.validatePOIParams(params);

            // For demo purposes, return mock data
            const mockPOIs = await this.getMockPOIData(params);
            
            // Cache the results
            this.setCache(cacheKey, mockPOIs);
            
            this.logger.info('POI search completed', { 
                resultCount: mockPOIs.length,
                category: params.category
            });
            
            return mockPOIs;
            
        } catch (error) {
            this.logger.error('POI search failed', { error: error.message, params });
            throw new Error(`POI search failed: ${error.message}`);
        }
    }

    /**
     * Get weather information for a location
     * @param {Object} params - Weather parameters
     * @param {number} params.lat - Latitude
     * @param {number} params.lng - Longitude
     * @param {boolean} params.forecast - Include forecast data
     * @returns {Promise<Object>} Weather information
     */
    async getWeatherInfo(params) {
        try {
            this.logger.info('Fetching weather info', { params });
            
            // Check cache first
            const cacheKey = this.generateCacheKey('weather', params);
            const cachedResult = this.getFromCache(cacheKey);
            if (cachedResult) {
                this.logger.info('Returning cached weather results');
                return cachedResult;
            }

            // For demo purposes, return mock data
            const mockWeather = await this.getMockWeatherData(params);
            
            // Cache the results (shorter cache for weather)
            this.setCache(cacheKey, mockWeather, 30 * 60 * 1000); // 30 minutes
            
            this.logger.info('Weather info retrieved');
            return mockWeather;
            
        } catch (error) {
            this.logger.error('Weather fetch failed', { error: error.message, params });
            throw new Error(`Weather fetch failed: ${error.message}`);
        }
    }

    /**
     * Get location details including photos, reviews, and additional info
     * @param {string} locationId - Location identifier
     * @returns {Promise<Object>} Detailed location information
     */
    async getLocationDetails(locationId) {
        try {
            this.logger.info('Fetching location details', { locationId });
            
            const mockDetails = await this.getMockLocationDetails(locationId);
            
            this.logger.info('Location details retrieved', { locationId });
            return mockDetails;
            
        } catch (error) {
            this.logger.error('Failed to get location details', { error: error.message, locationId });
            throw new Error(`Failed to get location details: ${error.message}`);
        }
    }

    /**
     * Get travel recommendations for a destination
     * @param {string} destination - Destination name or ID
     * @param {Object} preferences - User preferences
     * @returns {Promise<Object>} Travel recommendations
     */
    async getTravelRecommendations(destination, preferences = {}) {
        try {
            this.logger.info('Fetching travel recommendations', { destination, preferences });
            
            const recommendations = await this.getMockTravelRecommendations(destination, preferences);
            
            this.logger.info('Travel recommendations retrieved', { 
                destination,
                recommendationCount: recommendations.attractions.length
            });
            
            return recommendations;
            
        } catch (error) {
            this.logger.error('Failed to get travel recommendations', { error: error.message, destination });
            throw new Error(`Failed to get travel recommendations: ${error.message}`);
        }
    }

    /**
     * Validate location search parameters
     * @private
     */
    validateLocationSearchParams(params) {
        if (!params.query || params.query.trim().length < 2) {
            throw new Error('Search query must be at least 2 characters long');
        }

        if (params.coordinates) {
            if (typeof params.coordinates.lat !== 'number' || typeof params.coordinates.lng !== 'number') {
                throw new Error('Invalid coordinates format');
            }
        }
    }

    /**
     * Validate POI search parameters
     * @private
     */
    validatePOIParams(params) {
        if (typeof params.lat !== 'number' || typeof params.lng !== 'number') {
            throw new Error('Valid latitude and longitude are required');
        }

        if (params.lat < -90 || params.lat > 90) {
            throw new Error('Latitude must be between -90 and 90');
        }

        if (params.lng < -180 || params.lng > 180) {
            throw new Error('Longitude must be between -180 and 180');
        }

        if (params.radius && (params.radius < 100 || params.radius > 50000)) {
            throw new Error('Radius must be between 100 and 50000 meters');
        }
    }

    /**
     * Generate cache key for different types of searches
     * @private
     */
    generateCacheKey(type, params) {
        const key = `${type}_${JSON.stringify(params)}`;
        return key.replace(/[^a-zA-Z0-9_]/g, '_');
    }

    /**
     * Get data from cache if not expired
     * @private
     */
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < cached.timeout) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }

    /**
     * Set data in cache with custom timeout
     * @private
     */
    setCache(key, data, timeout = this.cacheTimeout) {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            timeout
        });
    }

    /**
     * Generate mock location data for demo purposes
     * @private
     */
    async getMockLocationData(searchParams) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // If searching for popular destinations, return curated list
        if (searchParams.query && searchParams.query.toLowerCase().includes('popular')) {
            return [
                {
                    id: 'paris-france',
                    name: 'Paris, France',
                    type: 'city',
                    country: 'France',
                    region: 'Europe',
                    coordinates: {
                        lat: 48.8566,
                        lng: 2.3522
                    },
                    description: 'The City of Light with iconic landmarks and rich culture',
                    image: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=800&h=600&fit=crop&crop=entropy&auto=format',
                    rating: 4.8,
                    reviewCount: 15420,
                    highlights: ['Eiffel Tower', 'Louvre Museum', 'Notre-Dame', 'Champs-Élysées'],
                    bestTimeToVisit: 'Apr-Oct',
                    averageStay: '4-6 days'
                },
                {
                    id: 'tokyo-japan',
                    name: 'Tokyo, Japan',
                    type: 'city',
                    country: 'Japan',
                    region: 'Asia',
                    coordinates: {
                        lat: 35.6762,
                        lng: 139.6503
                    },
                    description: 'Modern metropolis blending tradition with cutting-edge technology',
                    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=600&fit=crop&crop=entropy&auto=format',
                    rating: 4.7,
                    reviewCount: 12890,
                    highlights: ['Shibuya Crossing', 'Tokyo Tower', 'Senso-ji Temple', 'Harajuku'],
                    bestTimeToVisit: 'Mar-May, Sep-Nov',
                    averageStay: '5-7 days'
                },
                {
                    id: 'newyork-usa',
                    name: 'New York City, USA',
                    type: 'city',
                    country: 'United States',
                    region: 'North America',
                    coordinates: {
                        lat: 40.7128,
                        lng: -74.0060
                    },
                    description: 'The Big Apple - bustling city that never sleeps',
                    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=600&fit=crop&crop=entropy&auto=format',
                    rating: 4.6,
                    reviewCount: 18750,
                    highlights: ['Times Square', 'Central Park', 'Statue of Liberty', 'Broadway'],
                    bestTimeToVisit: 'Apr-Jun, Sep-Nov',
                    averageStay: '4-6 days'
                },
                {
                    id: 'london-uk',
                    name: 'London, England',
                    type: 'city',
                    country: 'United Kingdom',
                    region: 'Europe',
                    coordinates: {
                        lat: 51.5074,
                        lng: -0.1278
                    },
                    description: 'Historic capital with royal palaces and modern attractions',
                    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=600&fit=crop&crop=entropy&auto=format',
                    rating: 4.5,
                    reviewCount: 14320,
                    highlights: ['Big Ben', 'Tower Bridge', 'British Museum', 'Buckingham Palace'],
                    bestTimeToVisit: 'May-Sep',
                    averageStay: '3-5 days'
                },
                {
                    id: 'rome-italy',
                    name: 'Rome, Italy',
                    type: 'city',
                    country: 'Italy',
                    region: 'Europe',
                    coordinates: {
                        lat: 41.9028,
                        lng: 12.4964
                    },
                    description: 'Eternal City with ancient history and incredible architecture',
                    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&h=600&fit=crop&crop=entropy&auto=format',
                    rating: 4.7,
                    reviewCount: 11680,
                    highlights: ['Colosseum', 'Vatican City', 'Trevi Fountain', 'Roman Forum'],
                    bestTimeToVisit: 'Apr-Jun, Sep-Oct',
                    averageStay: '3-4 days'
                },
                {
                    id: 'barcelona-spain',
                    name: 'Barcelona, Spain',
                    type: 'city',
                    country: 'Spain',
                    region: 'Europe',
                    coordinates: {
                        lat: 41.3851,
                        lng: 2.1734
                    },
                    description: 'Vibrant Mediterranean city with stunning architecture and beaches',
                    image: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&h=600&fit=crop&crop=entropy&auto=format',
                    rating: 4.6,
                    reviewCount: 9870,
                    highlights: ['Sagrada Familia', 'Park Güell', 'Las Ramblas', 'Gothic Quarter'],
                    bestTimeToVisit: 'May-Jun, Sep-Oct',
                    averageStay: '3-4 days'
                },
                {
                    id: 'dubai-uae',
                    name: 'Dubai, UAE',
                    type: 'city',
                    country: 'United Arab Emirates',
                    region: 'Middle East',
                    coordinates: {
                        lat: 25.2048,
                        lng: 55.2708
                    },
                    description: 'Futuristic city with luxury shopping and modern architecture',
                    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=600&fit=crop&crop=entropy&auto=format',
                    rating: 4.4,
                    reviewCount: 8950,
                    highlights: ['Burj Khalifa', 'Dubai Mall', 'Palm Jumeirah', 'Desert Safari'],
                    bestTimeToVisit: 'Nov-Mar',
                    averageStay: '3-5 days'
                },
                {
                    id: 'sydney-australia',
                    name: 'Sydney, Australia',
                    type: 'city',
                    country: 'Australia',
                    region: 'Oceania',
                    coordinates: {
                        lat: -33.8688,
                        lng: 151.2093
                    },
                    description: 'Harbor city with iconic landmarks and beautiful beaches',
                    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&crop=entropy&auto=format',
                    rating: 4.5,
                    reviewCount: 7650,
                    highlights: ['Sydney Opera House', 'Harbour Bridge', 'Bondi Beach', 'The Rocks'],
                    bestTimeToVisit: 'Sep-Nov, Mar-May',
                    averageStay: '4-6 days'
                }
            ];
        }

        // For other searches, return dynamic results
        const locations = [
            {
                id: `LOC${Date.now()}_1`,
                name: `${searchParams.query} City Center`,
                type: 'city',
                country: 'United States',
                region: 'North America',
                coordinates: {
                    lat: 40.7128 + (Math.random() - 0.5) * 0.1,
                    lng: -74.0060 + (Math.random() - 0.5) * 0.1
                },
                description: `Explore the vibrant heart of ${searchParams.query} with its rich culture and attractions.`,
                image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&h=600&fit=crop&crop=entropy&auto=format',
                rating: Math.round((4 + Math.random()) * 10) / 10,
                reviewCount: Math.floor(Math.random() * 5000) + 500,
                highlights: ['Historic Architecture', 'Cultural Sites', 'Local Cuisine', 'Shopping'],
                bestTimeToVisit: 'April - October',
                averageStay: '3-5 days'
            },
            {
                id: `LOC${Date.now()}_2`,
                name: `${searchParams.query} Historic District`,
                type: 'district',
                country: 'United States',
                region: 'North America',
                coordinates: {
                    lat: 40.7128 + (Math.random() - 0.5) * 0.05,
                    lng: -74.0060 + (Math.random() - 0.5) * 0.05
                },
                description: `Step back in time in the historic district of ${searchParams.query}.`,
                image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop&crop=entropy&auto=format',
                rating: Math.round((4.2 + Math.random() * 0.8) * 10) / 10,
                reviewCount: Math.floor(Math.random() * 2000) + 200,
                highlights: ['Museums', 'Historic Buildings', 'Walking Tours', 'Art Galleries'],
                bestTimeToVisit: 'Year-round',
                averageStay: '1-2 days'
            },
            {
                id: `LOC${Date.now()}_3`,
                name: `${searchParams.query} Waterfront`,
                type: 'area',
                country: 'United States',
                region: 'North America',
                coordinates: {
                    lat: 40.7128 + (Math.random() - 0.5) * 0.08,
                    lng: -74.0060 + (Math.random() - 0.5) * 0.08
                },
                description: `Beautiful waterfront area of ${searchParams.query} with scenic views.`,
                image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&crop=entropy&auto=format',
                rating: Math.round((4.1 + Math.random() * 0.7) * 10) / 10,
                reviewCount: Math.floor(Math.random() * 1500) + 300,
                highlights: ['Scenic Views', 'Restaurants', 'Walking Paths', 'Boat Tours'],
                bestTimeToVisit: 'May - September',
                averageStay: '1-2 days'
            }
        ];

        return locations;
    }

    /**
     * Generate mock POI data for demo purposes
     * @private
     */
    async getMockPOIData(params) {
        await new Promise(resolve => setTimeout(resolve, 600));

        const categories = {
            restaurant: ['Fine Dining Restaurant', 'Local Bistro', 'Street Food Market'],
            attraction: ['Historic Monument', 'Art Museum', 'Scenic Viewpoint'],
            shopping: ['Local Market', 'Shopping Center', 'Boutique District'],
            entertainment: ['Theater', 'Music Venue', 'Night Club'],
            nature: ['City Park', 'Botanical Garden', 'Waterfront']
        };

        const selectedCategory = params.category || 'attraction';
        const poiTypes = categories[selectedCategory] || categories.attraction;

        const pois = [];
        for (let i = 0; i < 6; i++) {
            const distance = Math.random() * (params.radius || 5000);
            pois.push({
                id: `POI${Date.now()}_${i}`,
                name: `${poiTypes[i % poiTypes.length]} ${i + 1}`,
                category: selectedCategory,
                type: poiTypes[i % poiTypes.length],
                coordinates: {
                    lat: params.lat + (Math.random() - 0.5) * 0.01,
                    lng: params.lng + (Math.random() - 0.5) * 0.01
                },
                distance: Math.round(distance),
                rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
                reviewCount: Math.floor(Math.random() * 1000) + 50,
                priceLevel: Math.floor(Math.random() * 4) + 1, // 1-4 scale
                openNow: Math.random() > 0.3,
                image: `https://images.unsplash.com/400x300/?${selectedCategory}&${i}`,
                description: `A wonderful ${poiTypes[i % poiTypes.length].toLowerCase()} perfect for travelers.`,
                address: `${100 + i} Main Street, City Center`,
                phone: `+1 (555) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
                website: `https://example.com/poi${i}`,
                hours: {
                    monday: '9:00 AM - 6:00 PM',
                    tuesday: '9:00 AM - 6:00 PM',
                    wednesday: '9:00 AM - 6:00 PM',
                    thursday: '9:00 AM - 6:00 PM',
                    friday: '9:00 AM - 8:00 PM',
                    saturday: '10:00 AM - 8:00 PM',
                    sunday: '10:00 AM - 6:00 PM'
                }
            });
        }

        return pois.sort((a, b) => a.distance - b.distance);
    }

    /**
     * Generate mock weather data for demo purposes
     * @private
     */
    async getMockWeatherData(params) {
        await new Promise(resolve => setTimeout(resolve, 400));

        const conditions = ['Clear', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Sunny'];
        const currentCondition = conditions[Math.floor(Math.random() * conditions.length)];
        const temperature = Math.round(15 + Math.random() * 20); // 15-35°C

        const weather = {
            current: {
                temperature,
                condition: currentCondition,
                humidity: Math.round(40 + Math.random() * 40), // 40-80%
                windSpeed: Math.round(Math.random() * 20), // 0-20 km/h
                visibility: Math.round(8 + Math.random() * 7), // 8-15 km
                uvIndex: Math.floor(Math.random() * 11), // 0-10
                icon: `https://openweathermap.org/img/w/${currentCondition.toLowerCase().replace(' ', '')}.png`
            },
            location: {
                coordinates: { lat: params.lat, lng: params.lng },
                timezone: 'UTC-5',
                sunrise: '06:30',
                sunset: '19:45'
            }
        };

        if (params.forecast) {
            weather.forecast = [];
            for (let i = 1; i <= 5; i++) {
                weather.forecast.push({
                    date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    high: temperature + Math.round((Math.random() - 0.5) * 6),
                    low: temperature - Math.round(Math.random() * 8 + 5),
                    condition: conditions[Math.floor(Math.random() * conditions.length)],
                    precipitation: Math.round(Math.random() * 30), // 0-30%
                    icon: `https://openweathermap.org/img/w/day.png`
                });
            }
        }

        return weather;
    }

    /**
     * Generate mock location details
     * @private
     */
    async getMockLocationDetails(locationId) {
        await new Promise(resolve => setTimeout(resolve, 500));

        return {
            id: locationId,
            photos: [
                `https://images.unsplash.com/800x600/?location&1&sig=${locationId}`,
                `https://images.unsplash.com/800x600/?location&2&sig=${locationId}`,
                `https://images.unsplash.com/800x600/?location&3&sig=${locationId}`
            ],
            reviews: [
                {
                    id: `REV${Date.now()}_1`,
                    rating: 5,
                    text: 'Amazing place with incredible views and rich history!',
                    author: 'TravelLover123',
                    date: '2024-01-15',
                    helpful: 12
                },
                {
                    id: `REV${Date.now()}_2`,
                    rating: 4,
                    text: 'Great destination, would definitely recommend visiting.',
                    author: 'Explorer456',
                    date: '2024-01-10',
                    helpful: 8
                }
            ],
            facts: [
                'Founded in 1850',
                'Population: 2.5 million',
                'Area: 468 square kilometers',
                'Official language: English'
            ],
            transportation: {
                airport: 'International Airport (25 km)',
                publicTransport: 'Metro, Bus, Taxi',
                walkability: 'Very walkable city center'
            },
            safety: {
                overall: 'Generally safe for tourists',
                tips: ['Stay aware of surroundings', 'Keep valuables secure', 'Use official transportation']
            }
        };
    }

    /**
     * Generate mock travel recommendations
     * @private
     */
    async getMockTravelRecommendations(destination, preferences) {
        await new Promise(resolve => setTimeout(resolve, 700));

        return {
            destination,
            attractions: [
                {
                    name: 'Historic City Center',
                    type: 'Historic Site',
                    rating: 4.6,
                    duration: '2-3 hours',
                    description: 'Explore centuries of history in the beautifully preserved city center.'
                },
                {
                    name: 'Art Museum',
                    type: 'Museum',
                    rating: 4.4,
                    duration: '1-2 hours',
                    description: 'World-class collection of contemporary and classical art.'
                },
                {
                    name: 'Scenic Waterfront',
                    type: 'Nature',
                    rating: 4.7,
                    duration: '1-2 hours',
                    description: 'Beautiful waterfront with walking paths and stunning views.'
                }
            ],
            restaurants: [
                {
                    name: 'Local Flavors',
                    cuisine: 'Traditional',
                    priceRange: '$$',
                    rating: 4.5,
                    specialty: 'Regional specialties and fresh seafood'
                },
                {
                    name: 'Modern Bistro',
                    cuisine: 'Contemporary',
                    priceRange: '$$$',
                    rating: 4.3,
                    specialty: 'Farm-to-table dining with seasonal menu'
                }
            ],
            activities: [
                {
                    name: 'Walking Food Tour',
                    type: 'Food & Drink',
                    duration: '3 hours',
                    price: '$65',
                    description: 'Taste local specialties while exploring the city'
                },
                {
                    name: 'Boat Tour',
                    type: 'Sightseeing',
                    duration: '2 hours',
                    price: '$45',
                    description: 'See the city from the water with expert commentary'
                }
            ],
            tips: [
                'Best time to visit is during spring and fall',
                'Book restaurants in advance during peak season',
                'Public transportation is efficient and affordable',
                'Many attractions offer student and senior discounts'
            ]
        };
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        this.logger.info('Location service cache cleared');
    }
} 