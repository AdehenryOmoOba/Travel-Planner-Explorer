/**
 * Flight Service Module
 * Handles flight search, booking, and flight-related operations
 */
import { Logger } from '../utils/Logger.js';

export class FlightService {
    constructor() {
        this.logger = new Logger('FlightService');
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.apiEndpoints = {
            kiwi: 'https://api.tequila.kiwi.com/v2',
            amadeus: 'https://api.amadeus.com/v2',
            skyscanner: 'https://partners.api.skyscanner.net/apiservices'
        };
        
        this.logger.info('FlightService initialized');
    }

    /**
     * Search for flights
     */
    async searchFlights(searchParams) {
        try {
            this.logger.info('Searching flights', searchParams);
            
            // Validate search parameters
            this.validateSearchParams(searchParams);
            
            // Check cache first
            const cacheKey = this.generateCacheKey(searchParams);
            const cachedResult = this.getFromCache(cacheKey);
            if (cachedResult) {
                this.logger.debug('Returning cached flight results');
                return cachedResult;
            }
            
            // For demo purposes, use mock data
            // In production, this would call real flight APIs
            const flights = await this.getMockFlightData(searchParams);
            
            // Apply filters and sorting
            const filteredFlights = this.applyFilters(flights, searchParams.filters || {});
            const sortedFlights = this.sortFlights(filteredFlights, searchParams.sortBy || 'price');
            
            // Cache results
            this.setCache(cacheKey, sortedFlights);
            
            this.logger.info(`Found ${sortedFlights.length} flights`);
            return sortedFlights;
            
        } catch (error) {
            this.logger.error('Flight search failed', error);
            throw error;
        }
    }

    /**
     * Get flight details by ID
     */
    async getFlightDetails(flightId) {
        try {
            this.logger.info('Getting flight details', { flightId });
            
            // Check cache first
            const cacheKey = `flight_details_${flightId}`;
            const cachedResult = this.getFromCache(cacheKey);
            if (cachedResult) {
                return cachedResult;
            }
            
            // Get mock flight details
            const flightDetails = await this.getMockFlightDetails(flightId);
            
            // Cache result
            this.setCache(cacheKey, flightDetails);
            
            return flightDetails;
            
        } catch (error) {
            this.logger.error('Failed to get flight details', error);
            throw error;
        }
    }

    /**
     * Get popular destinations
     */
    async getPopularDestinations() {
        try {
            this.logger.info('Getting popular destinations');
            
            const cacheKey = 'popular_destinations';
            const cachedResult = this.getFromCache(cacheKey);
            if (cachedResult) {
                return cachedResult;
            }
            
            const destinations = await this.getMockPopularDestinations();
            
            // Cache for longer period (1 hour)
            this.setCache(cacheKey, destinations, 60 * 60 * 1000);
            
            return destinations;
            
        } catch (error) {
            this.logger.error('Failed to get popular destinations', error);
            throw error;
        }
    }

    /**
     * Book a flight
     */
    async bookFlight(flightId, passengerDetails, paymentInfo) {
        try {
            this.logger.info('Booking flight', { flightId });
            
            // Validate booking data
            this.validateBookingData(passengerDetails, paymentInfo);
            
            // Get flight details
            const flightDetails = await this.getFlightDetails(flightId);
            
            // Simulate booking process
            const booking = await this.simulateBooking(flightDetails, passengerDetails, paymentInfo);
            
            this.logger.info('Flight booked successfully', { bookingId: booking.id });
            return booking;
            
        } catch (error) {
            this.logger.error('Flight booking failed', error);
            throw error;
        }
    }

    /**
     * Validate search parameters
     */
    validateSearchParams(params) {
        const required = ['origin', 'destination', 'departureDate'];
        const missing = required.filter(field => !params[field]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required fields: ${missing.join(', ')}`);
        }
        
        // Validate dates
        const departureDate = new Date(params.departureDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (departureDate < today) {
            throw new Error('Departure date cannot be in the past');
        }
        
        if (params.returnDate) {
            const returnDate = new Date(params.returnDate);
            if (returnDate <= departureDate) {
                throw new Error('Return date must be after departure date');
            }
        }
        
        // Validate passenger count
        if (params.passengers && (params.passengers < 1 || params.passengers > 9)) {
            throw new Error('Passenger count must be between 1 and 9');
        }
    }

    /**
     * Validate booking data
     */
    validateBookingData(passengerDetails, paymentInfo) {
        if (!passengerDetails || !Array.isArray(passengerDetails) || passengerDetails.length === 0) {
            throw new Error('Passenger details are required');
        }
        
        passengerDetails.forEach((passenger, index) => {
            if (!passenger.firstName || !passenger.lastName || !passenger.dateOfBirth) {
                throw new Error(`Incomplete details for passenger ${index + 1}`);
            }
        });
        
        if (!paymentInfo || !paymentInfo.cardNumber || !paymentInfo.expiryDate || !paymentInfo.cvv) {
            throw new Error('Complete payment information is required');
        }
    }

    /**
     * Apply filters to flight results
     */
    applyFilters(flights, filters) {
        let filtered = [...flights];
        
        if (filters.maxPrice) {
            filtered = filtered.filter(flight => flight.price.amount <= filters.maxPrice);
        }
        
        if (filters.airlines && filters.airlines.length > 0) {
            filtered = filtered.filter(flight => filters.airlines.includes(flight.airline));
        }
        
        if (filters.maxStops !== undefined) {
            filtered = filtered.filter(flight => flight.stops <= filters.maxStops);
        }
        
        if (filters.departureTimeRange) {
            const { start, end } = filters.departureTimeRange;
            filtered = filtered.filter(flight => {
                const departureHour = new Date(flight.departure.time).getHours();
                return departureHour >= start && departureHour <= end;
            });
        }
        
        if (filters.maxDuration) {
            filtered = filtered.filter(flight => flight.duration <= filters.maxDuration);
        }
        
        return filtered;
    }

    /**
     * Sort flights by specified criteria
     */
    sortFlights(flights, sortBy) {
        const sortFunctions = {
            price: (a, b) => a.price.amount - b.price.amount,
            duration: (a, b) => a.duration - b.duration,
            departure: (a, b) => new Date(a.departure.time) - new Date(b.departure.time),
            arrival: (a, b) => new Date(a.arrival.time) - new Date(b.arrival.time),
            stops: (a, b) => a.stops - b.stops
        };
        
        const sortFunction = sortFunctions[sortBy] || sortFunctions.price;
        return [...flights].sort(sortFunction);
    }

    /**
     * Generate cache key for search parameters
     */
    generateCacheKey(params) {
        const keyParts = [
            params.origin,
            params.destination,
            params.departureDate,
            params.returnDate || '',
            params.passengers || 1,
            params.class || 'economy'
        ];
        return `flights_${keyParts.join('_')}`;
    }

    /**
     * Get data from cache
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
     * Set data in cache
     */
    setCache(key, data, timeout = this.cacheTimeout) {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            timeout
        });
    }

    /**
     * Generate mock flight data for demo purposes
     */
    async getMockFlightData(searchParams) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const airlines = ['American Airlines', 'Delta', 'United', 'Southwest', 'JetBlue', 'Alaska Airlines'];
        const aircraftTypes = ['Boeing 737', 'Airbus A320', 'Boeing 777', 'Airbus A330', 'Boeing 787'];
        
        const flights = [];
        const flightCount = Math.floor(Math.random() * 15) + 10; // 10-25 flights
        
        for (let i = 0; i < flightCount; i++) {
            const airline = airlines[Math.floor(Math.random() * airlines.length)];
            const aircraft = aircraftTypes[Math.floor(Math.random() * aircraftTypes.length)];
            const stops = Math.floor(Math.random() * 3); // 0-2 stops
            const basePrice = 200 + Math.floor(Math.random() * 800); // $200-$1000
            const duration = 120 + Math.floor(Math.random() * 480); // 2-10 hours
            
            const departureTime = new Date(searchParams.departureDate);
            departureTime.setHours(6 + Math.floor(Math.random() * 16)); // 6 AM - 10 PM
            departureTime.setMinutes(Math.floor(Math.random() * 60));
            
            const arrivalTime = new Date(departureTime.getTime() + duration * 60000);
            
            flights.push({
                id: `flight_${i + 1}_${Date.now()}`,
                airline,
                flightNumber: `${airline.substring(0, 2).toUpperCase()}${Math.floor(Math.random() * 9000) + 1000}`,
                aircraft,
                origin: searchParams.origin,
                destination: searchParams.destination,
                departure: {
                    time: departureTime.toISOString(),
                    airport: this.getAirportCode(searchParams.origin),
                    terminal: Math.floor(Math.random() * 5) + 1
                },
                arrival: {
                    time: arrivalTime.toISOString(),
                    airport: this.getAirportCode(searchParams.destination),
                    terminal: Math.floor(Math.random() * 5) + 1
                },
                duration, // in minutes
                stops,
                price: {
                    amount: basePrice + (stops * 50), // Add $50 per stop
                    currency: 'USD'
                },
                class: searchParams.class || 'economy',
                availableSeats: Math.floor(Math.random() * 50) + 10,
                baggage: {
                    carry: '1 carry-on included',
                    checked: stops === 0 ? '1 checked bag included' : 'Additional fees apply'
                },
                amenities: this.generateAmenities(),
                bookingClass: this.generateBookingClass(),
                refundable: Math.random() > 0.7,
                changeable: Math.random() > 0.5
            });
        }
        
        return flights;
    }

    /**
     * Get mock flight details
     */
    async getMockFlightDetails(flightId) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return {
            id: flightId,
            airline: 'Delta Airlines',
            flightNumber: 'DL1234',
            aircraft: 'Boeing 737-800',
            route: {
                origin: { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York' },
                destination: { code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles' }
            },
            schedule: {
                departure: { time: '2024-02-15T08:30:00Z', gate: 'A12', terminal: '4' },
                arrival: { time: '2024-02-15T14:45:00Z', gate: 'B8', terminal: '2' }
            },
            duration: 375, // 6h 15m
            distance: 2475, // miles
            stops: 0,
            price: { amount: 450, currency: 'USD' },
            seatMap: this.generateSeatMap(),
            meals: ['Breakfast', 'Snack'],
            entertainment: ['Movies', 'TV Shows', 'Music', 'Games'],
            wifi: true,
            powerOutlets: true,
            policies: {
                cancellation: '24-hour free cancellation',
                changes: 'Changes allowed with fee',
                baggage: '1 carry-on and 1 personal item included'
            }
        };
    }

    /**
     * Get mock popular destinations
     */
    async getMockPopularDestinations() {
        await new Promise(resolve => setTimeout(resolve, 300));
        
        return [
            { code: 'LAX', city: 'Los Angeles', country: 'USA', price: 299 },
            { code: 'LHR', city: 'London', country: 'UK', price: 599 },
            { code: 'NRT', city: 'Tokyo', country: 'Japan', price: 899 },
            { code: 'CDG', city: 'Paris', country: 'France', price: 549 },
            { code: 'DXB', city: 'Dubai', country: 'UAE', price: 699 },
            { code: 'SYD', city: 'Sydney', country: 'Australia', price: 1199 },
            { code: 'FCO', city: 'Rome', country: 'Italy', price: 529 },
            { code: 'BKK', city: 'Bangkok', country: 'Thailand', price: 799 }
        ];
    }

    /**
     * Simulate flight booking
     */
    async simulateBooking(flightDetails, passengerDetails, paymentInfo) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return {
            id: `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            confirmationCode: Math.random().toString(36).substr(2, 6).toUpperCase(),
            flight: flightDetails,
            passengers: passengerDetails,
            totalPrice: flightDetails.price.amount * passengerDetails.length,
            bookingDate: new Date().toISOString(),
            status: 'confirmed',
            eTickets: passengerDetails.map((passenger, index) => ({
                ticketNumber: `${Math.random().toString(36).substr(2, 10).toUpperCase()}`,
                passenger: `${passenger.firstName} ${passenger.lastName}`,
                seat: `${Math.floor(Math.random() * 30) + 1}${String.fromCharCode(65 + Math.floor(Math.random() * 6))}`
            }))
        };
    }

    /**
     * Helper methods
     */
    getAirportCode(city) {
        const codes = {
            'New York': 'JFK',
            'Los Angeles': 'LAX',
            'Chicago': 'ORD',
            'Miami': 'MIA',
            'London': 'LHR',
            'Paris': 'CDG',
            'Tokyo': 'NRT',
            'Dubai': 'DXB'
        };
        return codes[city] || 'XXX';
    }

    generateAmenities() {
        const allAmenities = ['WiFi', 'Power Outlets', 'Entertainment', 'Meals', 'Drinks', 'Blankets'];
        const count = Math.floor(Math.random() * 4) + 2;
        return allAmenities.sort(() => 0.5 - Math.random()).slice(0, count);
    }

    generateBookingClass() {
        const classes = ['Basic Economy', 'Economy', 'Premium Economy', 'Business', 'First'];
        return classes[Math.floor(Math.random() * classes.length)];
    }

    generateSeatMap() {
        // Simplified seat map generation
        const rows = 30;
        const seatsPerRow = 6;
        const seatMap = [];
        
        for (let row = 1; row <= rows; row++) {
            const rowSeats = [];
            for (let seat = 0; seat < seatsPerRow; seat++) {
                const seatLetter = String.fromCharCode(65 + seat);
                rowSeats.push({
                    number: `${row}${seatLetter}`,
                    available: Math.random() > 0.3,
                    type: seat < 2 || seat > 3 ? 'window' : 'aisle',
                    price: row <= 5 ? 50 : 0 // Premium seats
                });
            }
            seatMap.push(rowSeats);
        }
        
        return seatMap;
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        this.logger.info('Flight service cache cleared');
    }
} 