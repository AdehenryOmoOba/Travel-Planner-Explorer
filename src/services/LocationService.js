import { Logger } from '../utils/Logger.js';
import axios from 'axios';
import { API_CONFIG } from '../config/api.config.js';

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
                apiKey: 'demo-key' // process.env.GOOGLE_PLACES_API_KEY fallback
            },
            foursquare: {
                baseUrl: 'https://api.foursquare.com/v3/places',
                apiKey: 'demo-key' // process.env.FOURSQUARE_API_KEY fallback
            },
            openweather: {
                baseUrl: 'https://api.openweathermap.org/data/2.5',
                apiKey: 'demo-key' // process.env.OPENWEATHER_API_KEY fallback
            }
        };
        
        this.logger.info('LocationService initialized');
    }

    /**
     * Search for locations and points of interest
     * @param {Object} params - Search parameters
     * @returns {Promise<Array>} Array of locations
     */
    async searchLocations(params) {
        try {
            const cacheKey = this.generateCacheKey('locations', params);
            const cachedResult = this.getFromCache(cacheKey);
            if (cachedResult) {
                return cachedResult;
            }

            const { apiKey } = API_CONFIG.foursquare;
            
            // If no API key or it's empty, use mock data immediately
            if (!apiKey || apiKey.trim() === '') {
                this.logger.info('No API key configured, using mock data');
                return await this.getMockLocationData(params);
            }

            const options = {
                method: 'GET',
                headers: {
                    'accept': 'application/json',
                    'Authorization': apiKey
                }
            };

            // If searching for popular destinations, use a curated list of major cities
            if (params.query === 'popular destinations') {
                try {
                const popularCities = [
                    'New York',
                    'London',
                    'Paris',
                    'Tokyo',
                    'Rome',
                    'Sydney',
                    'Dubai',
                    'Bangkok'
                ];

                const searchPromises = popularCities.map(city => 
                        this.searchCity(city, options).catch(() => []) // Handle individual city failures
                );

                const results = await Promise.all(searchPromises);
                const destinations = results.flat().map(place => this.formatPlaceData(place));
                    
                    // If we got no results from API, use mock data
                    if (destinations.length === 0) {
                        return await this.getMockLocationData(params);
                    }
                
                this.setCache(cacheKey, destinations, this.cacheTimeout);
                return destinations;
                } catch (error) {
                    this.logger.warn('API call failed, using mock data', error);
                    return await this.getMockLocationData(params);
                }
            }

            // Regular search
            try {
            const searchParams = new URLSearchParams({
                query: params.query || '',
                near: params.near || 'New York',
                categories: '16000',
                sort: 'RATING',
                limit: 50,
                fields: 'fsq_id,name,description,geocodes,location,categories,stats,rating,price,photos,hours,website,tel'
            });

            const response = await fetch(
                `https://api.foursquare.com/v3/places/search?${searchParams.toString()}`,
                options
            );

            if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const places = data.results.map(place => this.formatPlaceData(place));
            
            this.setCache(cacheKey, places, this.cacheTimeout);
            return places;
            } catch (error) {
                this.logger.warn('API call failed, using mock data', error);
                return await this.getMockLocationData(params);
            }
            
        } catch (error) {
            this.logger.error('Location search failed, falling back to mock data', { error: error.message, params });
            // Always fall back to mock data on any error
            return await this.getMockLocationData(params);
        }
    }

    /**
     * Search for a specific city
     * @private
     */
    async searchCity(city, options) {
        try {
        const searchParams = new URLSearchParams({
            query: city,
            categories: '16000',
            sort: 'RATING',
            limit: 1,
            fields: 'fsq_id,name,description,geocodes,location,categories,stats,rating,price,photos,hours,website,tel'
        });

        const response = await fetch(
            `https://api.foursquare.com/v3/places/search?${searchParams.toString()}`,
            options
        );

        if (!response.ok) {
            this.logger.warn(`Failed to search for city: ${city}`);
            return [];
        }

        const data = await response.json();
        return data.results;
        } catch (error) {
            this.logger.warn(`Error searching for city: ${city}`, error);
            return [];
        }
    }

    /**
     * Get points of interest near a location
     * @param {Object} params - Search parameters
     * @returns {Promise<Array>} Array of points of interest
     */
    async getPointsOfInterest(params) {
        try {
            const cacheKey = this.generateCacheKey('poi', params);
            const cachedResult = this.getFromCache(cacheKey);
            if (cachedResult) {
                return cachedResult;
            }

            const { apiKey } = API_CONFIG.foursquare;
            
            // If no API key, use mock data
            if (!apiKey || apiKey.trim() === '') {
                return await this.getMockPOIData(params);
            }

            try {
            const options = {
                method: 'GET',
                headers: {
                    'accept': 'application/json',
                    'Authorization': apiKey
                }
            };

            // Build search URL with parameters
            const searchParams = new URLSearchParams({
                near: params.near || '',
                categories: params.categories || '16000', // Default to Landmarks and Outdoors
                sort: 'RATING',
                limit: 50,
                fields: 'fsq_id,name,description,geocodes,location,categories,stats,rating,price,photos,hours,website,tel'
            });

            const response = await fetch(
                `https://api.foursquare.com/v3/places/search?${searchParams.toString()}`,
                options
            );

            if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const pois = data.results.map(place => this.formatPlaceData(place));
            
            this.setCache(cacheKey, pois, this.cacheTimeout);
            return pois;
            } catch (error) {
                this.logger.warn('POI API call failed, using mock data', error);
                return await this.getMockPOIData(params);
            }
            
        } catch (error) {
            this.logger.error('POI search failed, falling back to mock data', { error: error.message, params });
            return await this.getMockPOIData(params);
        }
    }

    /**
     * Get detailed information about a place
     * @param {string} placeId - Foursquare place ID
     * @returns {Promise<Object>} Place details
     */
    async getPlaceDetails(placeId) {
        try {
            const cacheKey = this.generateCacheKey('place_details', placeId);
            const cachedResult = this.getFromCache(cacheKey);
            if (cachedResult) {
                return cachedResult;
            }

            const { apiKey } = API_CONFIG.foursquare;
            
            const options = {
                method: 'GET',
                headers: {
                    'accept': 'application/json',
                    'Authorization': apiKey
                }
            };

            const response = await fetch(
                `https://api.foursquare.com/v3/places/${placeId}`,
                options
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const details = this.formatPlaceData(data);
            
            this.setCache(cacheKey, details, this.cacheTimeout);
            return details;
            
        } catch (error) {
            this.logger.error('Place details fetch failed', { error: error.message, placeId });
            throw new Error(`Place details fetch failed: ${error.message}`);
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
            
            const cacheKey = this.generateCacheKey('weather', params);
            const cachedResult = this.getFromCache(cacheKey);
            if (cachedResult) {
                return cachedResult;
            }

            const { baseUrl, apiKey, endpoints } = API_CONFIG.weather;
            
            // If no API key, use mock data
            if (!apiKey || apiKey.trim() === '') {
                this.logger.info('No weather API key configured, using mock data');
                return await this.getMockWeatherData(params);
            }

            try {
            // Get current weather
                const currentWeatherResponse = await fetch(`${baseUrl}${endpoints.current}?lat=${params.lat}&lon=${params.lng}&appid=${apiKey}&units=metric`);

                if (!currentWeatherResponse.ok) {
                    throw new Error(`HTTP error! status: ${currentWeatherResponse.status}`);
                }

                const currentWeatherData = await currentWeatherResponse.json();

            const weatherData = {
                current: {
                        temperature: Math.round(currentWeatherData.main.temp),
                        condition: currentWeatherData.weather[0].main,
                        description: currentWeatherData.weather[0].description,
                        humidity: currentWeatherData.main.humidity,
                        windSpeed: Math.round(currentWeatherData.wind.speed * 3.6), // Convert m/s to km/h
                        visibility: currentWeatherData.visibility / 1000, // Convert m to km
                        icon: `https://openweathermap.org/img/w/${currentWeatherData.weather[0].icon}.png`
                },
                location: {
                    coordinates: { lat: params.lat, lng: params.lng },
                        timezone: currentWeatherData.timezone,
                        sunrise: new Date(currentWeatherData.sys.sunrise * 1000).toLocaleTimeString(),
                        sunset: new Date(currentWeatherData.sys.sunset * 1000).toLocaleTimeString()
                }
            };

            // Get forecast if requested
            if (params.forecast) {
                    const forecastResponse = await fetch(`${baseUrl}${endpoints.forecast}?lat=${params.lat}&lon=${params.lng}&appid=${apiKey}&units=metric`);

                    if (forecastResponse.ok) {
                        const forecastData = await forecastResponse.json();
                        weatherData.forecast = forecastData.list
                    .filter(item => item.dt_txt.includes('12:00:00')) // Get one forecast per day
                    .slice(0, 5)
                    .map(item => ({
                        date: item.dt_txt.split(' ')[0],
                        high: Math.round(item.main.temp_max),
                        low: Math.round(item.main.temp_min),
                        condition: item.weather[0].main,
                                description: item.weather[0].description,
                        precipitation: Math.round(item.pop * 100), // Convert probability to percentage
                        icon: `https://openweathermap.org/img/w/${item.weather[0].icon}.png`
                    }));
                    }
            }

            this.setCache(cacheKey, weatherData, 30 * 60 * 1000); // Cache for 30 minutes
            return weatherData;
            } catch (error) {
                this.logger.warn('Weather API call failed, using mock data', error);
                return await this.getMockWeatherData(params);
            }
            
        } catch (error) {
            this.logger.error('Weather fetch failed, falling back to mock data', { error: error.message, params });
            return await this.getMockWeatherData(params);
        }
    }

    /**
     * Get weather data for multiple destinations
     * @param {Array} destinations - Array of destinations with coordinates
     * @returns {Promise<Array>} Array of destinations with weather data
     */
    async getWeatherForDestinations(destinations) {
        try {
            this.logger.info('Fetching weather for multiple destinations', { count: destinations.length });
            
            const weatherPromises = destinations.map(async (destination) => {
                try {
                    const weather = await this.getWeatherInfo({
                        lat: destination.coordinates.lat,
                        lng: destination.coordinates.lng
                    });
                    
                    return {
                        ...destination,
                        weather: weather.current
                    };
                } catch (error) {
                    this.logger.warn(`Failed to get weather for ${destination.name}`, error);
                    // Return destination without weather data if individual fetch fails
                    return {
                        ...destination,
                        weather: null
                    };
                }
            });

            const destinationsWithWeather = await Promise.all(weatherPromises);
            this.logger.info('Weather data fetched for destinations', { 
                successCount: destinationsWithWeather.filter(d => d.weather).length,
                totalCount: destinations.length
            });
            
            return destinationsWithWeather;
        } catch (error) {
            this.logger.error('Failed to fetch weather for destinations', error);
            // Return original destinations if batch fetch fails
            return destinations;
        }
    }

    /**
     * Get location details including photos, reviews, and additional info
     * @param {string} locationId - Location identifier
     * @param {Object} basicInfo - Basic location information
     * @returns {Promise<Object>} Detailed location information
     */
    async getLocationDetails(locationId, basicInfo = null) {
        try {
            this.logger.info('Fetching location details', { locationId });
            const mockDetails = await this.getMockLocationDetails(locationId);
            // Merge basic info if provided
            let details = { ...mockDetails };
            if (basicInfo) {
                details = {
                    ...details,
                    name: basicInfo.name || details.name || 'Unknown',
                    country: basicInfo.country || details.country || 'Unknown',
                    description: basicInfo.description || details.description || 'No description available',
                    image: basicInfo.image || details.image,
                    rating: basicInfo.rating || details.rating,
                    highlights: basicInfo.highlights || details.highlights,
                    bestTimeToVisit: basicInfo.bestTimeToVisit || details.bestTimeToVisit
                };
            } else {
                // Fallbacks if mockDetails is missing fields
                details.name = details.name || 'Unknown';
                details.country = details.country || 'Unknown';
                details.description = details.description || 'No description available';
            }
            this.logger.info('Location details retrieved', { locationId });
            return details;
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
        return `${type}-${JSON.stringify(params)}`;
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
    setCache(key, data, timeout) {
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
                    averageStay: '4-6 days',
                    weather: await this.getWeatherInfo({
                        lat: 48.8566,
                        lng: 2.3522
                    }).then(weather => weather.current)
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
                    averageStay: '5-7 days',
                    weather: await this.getWeatherInfo({
                        lat: 35.6762,
                        lng: 139.6503
                    }).then(weather => weather.current)
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
                    averageStay: '4-6 days',
                    weather: await this.getWeatherInfo({
                        lat: 40.7128,
                        lng: -74.0060
                    }).then(weather => weather.current)
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
                    averageStay: '3-5 days',
                    weather: await this.getWeatherInfo({
                        lat: 51.5074,
                        lng: -0.1278
                    }).then(weather => weather.current)
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
                    averageStay: '3-4 days',
                    weather: await this.getWeatherInfo({
                        lat: 41.9028,
                        lng: 12.4964
                    }).then(weather => weather.current)
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
                    averageStay: '3-4 days',
                    weather: await this.getWeatherInfo({
                        lat: 41.3851,
                        lng: 2.1734
                    }).then(weather => weather.current)
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
                    averageStay: '3-5 days',
                    weather: await this.getWeatherInfo({
                        lat: 25.2048,
                        lng: 55.2708
                    }).then(weather => weather.current)
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
                    averageStay: '4-6 days',
                    weather: await this.getWeatherInfo({
                        lat: -33.8688,
                        lng: 151.2093
                    }).then(weather => weather.current)
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
                averageStay: '3-5 days',
                weather: await this.getWeatherInfo({
                    lat: 40.7128 + (Math.random() - 0.5) * 0.1,
                    lng: -74.0060 + (Math.random() - 0.5) * 0.1
                }).then(weather => weather.current)
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
                averageStay: '1-2 days',
                weather: await this.getWeatherInfo({
                    lat: 40.7128 + (Math.random() - 0.5) * 0.05,
                    lng: -74.0060 + (Math.random() - 0.5) * 0.05
                }).then(weather => weather.current)
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
                averageStay: '1-2 days',
                weather: await this.getWeatherInfo({
                    lat: 40.7128 + (Math.random() - 0.5) * 0.08,
                    lng: -74.0060 + (Math.random() - 0.5) * 0.08
                }).then(weather => weather.current)
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

        // City-specific weather patterns for more realistic mock data
        const cityWeatherPatterns = {
            // Paris coordinates
            '48.8566,2.3522': {
                conditions: ['Clear', 'Partly Cloudy', 'Cloudy', 'Light Rain'],
                tempRange: [8, 22], // 8-22°C
                humidity: [50, 80],
                icon: '01d'
            },
            // Tokyo coordinates  
            '35.6762,139.6503': {
                conditions: ['Clear', 'Partly Cloudy', 'Humid', 'Light Rain'],
                tempRange: [12, 28], // 12-28°C
                humidity: [60, 85],
                icon: '02d'
            },
            // New York coordinates
            '40.7128,-74.0060': {
                conditions: ['Clear', 'Partly Cloudy', 'Cloudy', 'Snow'],
                tempRange: [5, 25], // 5-25°C
                humidity: [45, 75],
                icon: '03d'
            },
            // London coordinates
            '51.5074,-0.1278': {
                conditions: ['Cloudy', 'Light Rain', 'Overcast', 'Partly Cloudy'],
                tempRange: [6, 18], // 6-18°C
                humidity: [65, 85],
                icon: '04d'
            },
            // Rome coordinates
            '41.9028,12.4964': {
                conditions: ['Clear', 'Sunny', 'Partly Cloudy', 'Warm'],
                tempRange: [10, 28], // 10-28°C
                humidity: [40, 70],
                icon: '01d'
            },
            // Barcelona coordinates
            '41.3851,2.1734': {
                conditions: ['Clear', 'Sunny', 'Partly Cloudy', 'Warm'],
                tempRange: [12, 26], // 12-26°C
                humidity: [50, 75],
                icon: '02d'
            },
            // Dubai coordinates
            '25.2048,55.2708': {
                conditions: ['Clear', 'Sunny', 'Hot', 'Very Hot'],
                tempRange: [20, 42], // 20-42°C
                humidity: [30, 60],
                icon: '01d'
            },
            // Sydney coordinates
            '-33.8688,151.2093': {
                conditions: ['Clear', 'Partly Cloudy', 'Sunny', 'Mild'],
                tempRange: [15, 25], // 15-25°C
                humidity: [50, 75],
                icon: '02d'
            }
        };

        // Create coordinate key for lookup
        const coordKey = `${Math.round(params.lat * 10000) / 10000},${Math.round(params.lng * 10000) / 10000}`;
        
        // Find closest matching city pattern or use default
        let weatherPattern = cityWeatherPatterns[coordKey];
        if (!weatherPattern) {
            // Find closest city by coordinates
            const cities = Object.keys(cityWeatherPatterns);
            let closestCity = cities[0];
            let minDistance = Infinity;
            
            cities.forEach(cityCoord => {
                const [cityLat, cityLng] = cityCoord.split(',').map(Number);
                const distance = Math.sqrt(
                    Math.pow(params.lat - cityLat, 2) + 
                    Math.pow(params.lng - cityLng, 2)
                );
                if (distance < minDistance) {
                    minDistance = distance;
                    closestCity = cityCoord;
                }
            });
            
            weatherPattern = cityWeatherPatterns[closestCity];
        }

        // Default pattern if no match found
        if (!weatherPattern) {
            weatherPattern = {
                conditions: ['Clear', 'Partly Cloudy', 'Cloudy'],
                tempRange: [15, 25],
                humidity: [50, 70],
                icon: '01d'
            };
        }

        const currentCondition = weatherPattern.conditions[Math.floor(Math.random() * weatherPattern.conditions.length)];
        const temperature = Math.round(weatherPattern.tempRange[0] + Math.random() * (weatherPattern.tempRange[1] - weatherPattern.tempRange[0]));
        const humidity = Math.round(weatherPattern.humidity[0] + Math.random() * (weatherPattern.humidity[1] - weatherPattern.humidity[0]));

        // Map conditions to more descriptive text
        const conditionDescriptions = {
            'Clear': 'clear sky',
            'Partly Cloudy': 'few clouds',
            'Cloudy': 'scattered clouds',
            'Light Rain': 'light rain',
            'Overcast': 'overcast clouds',
            'Sunny': 'clear sky',
            'Hot': 'clear sky',
            'Very Hot': 'clear sky',
            'Humid': 'few clouds',
            'Warm': 'clear sky',
            'Mild': 'few clouds',
            'Snow': 'light snow'
        };

        // Map conditions to appropriate weather icons
        const conditionIcons = {
            'Clear': '01d',
            'Partly Cloudy': '02d',
            'Cloudy': '03d',
            'Light Rain': '10d',
            'Overcast': '04d',
            'Sunny': '01d',
            'Hot': '01d',
            'Very Hot': '01d',
            'Humid': '02d',
            'Warm': '01d',
            'Mild': '02d',
            'Snow': '13d'
        };

        const weather = {
            current: {
                temperature,
                condition: currentCondition,
                description: conditionDescriptions[currentCondition] || 'clear sky',
                humidity,
                windSpeed: Math.round(Math.random() * 20), // 0-20 km/h
                visibility: Math.round(8 + Math.random() * 7), // 8-15 km
                uvIndex: Math.floor(Math.random() * 11), // 0-10
                icon: `https://openweathermap.org/img/w/${conditionIcons[currentCondition] || weatherPattern.icon}.png`
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
                const forecastTemp = temperature + Math.round((Math.random() - 0.5) * 6);
                const forecastCondition = weatherPattern.conditions[Math.floor(Math.random() * weatherPattern.conditions.length)];
                
                weather.forecast.push({
                    date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    high: forecastTemp + Math.round(Math.random() * 3),
                    low: forecastTemp - Math.round(Math.random() * 5 + 3),
                    condition: forecastCondition,
                    description: conditionDescriptions[forecastCondition] || 'clear sky',
                    precipitation: Math.round(Math.random() * 30), // 0-30%
                    icon: `https://openweathermap.org/img/w/${conditionIcons[forecastCondition] || weatherPattern.icon}.png`
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

    formatPlaceData(place) {
        if (!place) return null;

        // Get the first photo if available
        const photo = place.photos?.[0];
        const imageUrl = photo ? `${photo.prefix}original${photo.suffix}` : '';

        // Get the main category
        const mainCategory = place.categories?.[0];
        const categoryName = mainCategory?.name || 'Place';

        // Format the description
        const description = place.description || 
            `Explore ${place.name}, a ${categoryName.toLowerCase()} in ${place.location?.locality || place.location?.country || 'this location'}.`;

        // Calculate rating
        const rating = place.rating || (place.stats?.total_ratings ? 
            Math.min(5, Math.max(1, (place.stats.total_ratings / 100) + 3)) : 4.0);

        return {
            id: place.fsq_id,
            name: place.name,
            type: categoryName,
            description: description,
            coordinates: {
                lat: place.geocodes?.main?.latitude,
                lng: place.geocodes?.main?.longitude
            },
            image: imageUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop',
            rating: rating,
            reviewCount: place.stats?.total_ratings || 0,
            highlights: place.categories?.map(cat => cat.name) || [],
            address: place.location?.formatted_address,
            phone: place.tel,
            website: place.website,
            hours: place.hours?.display,
            price: place.price,
            bestTimeToVisit: this.getBestTimeToVisit(place.location?.country),
            stats: {
                totalRatings: place.stats?.total_ratings,
                totalTips: place.stats?.total_tips,
                totalPhotos: place.stats?.total_photos
            }
        };
    }

    getBestTimeToVisit(country) {
        // Simple mapping of countries to best visiting times
        const bestTimes = {
            'United States': 'Apr-Jun, Sep-Nov',
            'United Kingdom': 'May-Sep',
            'France': 'Apr-Oct',
            'Japan': 'Mar-May, Sep-Nov',
            'Italy': 'Apr-Jun, Sep-Oct',
            'Australia': 'Sep-Nov, Mar-May',
            'United Arab Emirates': 'Nov-Mar',
            'Thailand': 'Nov-Feb'
        };

        return bestTimes[country] || 'Year-round';
    }

    /**
     * Get country information
     * @param {string} countryName - Name of the country
     * @returns {Promise<Object>} Country information
     */
    async getCountryInfo(countryName) {
        try {
            const cacheKey = this.generateCacheKey('country', countryName);
            const cachedResult = this.getFromCache(cacheKey);
            if (cachedResult) {
                return cachedResult;
            }

            const { baseUrl, endpoints } = API_CONFIG.countries;
            const response = await axios.get(`${baseUrl}${endpoints.name}/${countryName}`);
            
            const countryData = response.data[0];
            const formattedData = {
                name: countryData.name.common,
                capital: countryData.capital?.[0],
                population: countryData.population,
                region: countryData.region,
                subregion: countryData.subregion,
                languages: Object.values(countryData.languages || {}),
                currencies: Object.values(countryData.currencies || {}).map(curr => curr.name),
                flag: countryData.flags.png,
                timezones: countryData.timezones,
                coordinates: countryData.latlng
            };

            this.setCache(cacheKey, formattedData, this.cacheTimeout);
            return formattedData;
            
        } catch (error) {
            this.logger.error('Country info fetch failed', { error: error.message, countryName });
            throw new Error(`Country info fetch failed: ${error.message}`);
        }
    }
} 