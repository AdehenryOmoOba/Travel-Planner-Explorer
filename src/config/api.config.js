// API Configuration
export const API_CONFIG = {
    // OpenWeatherMap API for weather data
    weather: {
        baseUrl: 'https://api.openweathermap.org/data/2.5',
        apiKey: import.meta.env.VITE_OPENWEATHER_API_KEY || '',
        endpoints: {
            current: '/weather',
            forecast: '/forecast'
        }
    },
    
    // Foursquare Places API for points of interest and destinations
    foursquare: {
        apiKey: import.meta.env.VITE_FOURSQUARE_API_KEY || ''
    },
    
    // REST Countries API for country information
    countries: {
        baseUrl: 'https://restcountries.com/v3.1',
        endpoints: {
            all: '/all',
            name: '/name'
        }
    }
}; 