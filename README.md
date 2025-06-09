# Travel Planner & Explorer

A comprehensive travel planning platform built with vanilla JavaScript, HTML, and CSS. This application allows users to plan trips, explore destinations, search for flights and hotels, and visualize their journey on interactive maps.

## 🌟 Features

### Core Functionality
- **Interactive Itinerary Builder**: Create detailed day-by-day travel schedules
- **Destination Explorer**: Search and discover amazing places around the world
- **Flight Search**: Find and compare flights with filtering options
- **Hotel Finder**: Discover accommodations with detailed information
- **Interactive Maps**: Explore destinations with Leaflet-powered maps
- **User Authentication**: Secure login and registration system
- **Responsive Design**: Optimized for desktop and mobile devices

### Advanced Features
- **Trip Templates**: Pre-configured itineraries for different travel types
- **Budget Tracking**: Monitor expenses and costs
- **Export Options**: Export itineraries to PDF, JSON, or iCal formats
- **Favorites System**: Save and organize favorite destinations
- **Social Sharing**: Share trip plans with friends and family
- **Offline Support**: Basic functionality works offline
- **Real-time Search**: Dynamic search with caching for performance

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Build Tool**: Vite
- **Maps**: Leaflet.js
- **Icons**: Font Awesome
- **Fonts**: Google Fonts (Montserrat, Open Sans)
- **Architecture**: ES6 Modules with clean separation of concerns

## 🚀 Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Travel-Planner-Explorer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` (or the port shown in your terminal)

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## 📁 Project Structure

```
Travel-Planner-Explorer/
├── index.html                 # Main HTML file
├── package.json              # Dependencies and scripts
├── vite.config.js            # Vite configuration
├── src/
│   ├── main.js               # Application entry point
│   ├── styles/
│   │   └── main.css          # Main stylesheet
│   ├── modules/              # Core application modules
│   │   ├── AuthenticationManager.js
│   │   ├── ItineraryManager.js
│   │   ├── NavigationManager.js
│   │   ├── StorageManager.js
│   │   └── UIManager.js
│   ├── services/             # API service modules
│   │   ├── FlightService.js
│   │   ├── HotelService.js
│   │   ├── LocationService.js
│   │   └── MapService.js
│   ├── utils/                # Utility functions
│   │   └── Logger.js
│   └── assets/               # Static assets
└── README.md
```

## 🎯 Usage Guide

### Creating Your First Trip

1. **Register/Login**: Click the "Register" button to create an account
2. **Navigate to Planner**: Click "My Trips" in the navigation
3. **Create New Trip**: Click the "New Trip" button
4. **Add Activities**: Use the "Add Item" buttons to add flights, hotels, and activities
5. **Organize by Time**: Drag items between different time slots (Morning, Afternoon, Evening, Night)

### Exploring Destinations

1. **Use the Search**: Enter a destination in the hero search or explore page
2. **Filter Results**: Use category filters to find specific types of attractions
3. **View Details**: Click on any destination to see detailed information
4. **Add to Trip**: Click "Add to Trip" to include destinations in your itinerary

### Using the Map

1. **Navigate to Map**: Click "Map" in the navigation
2. **Search Locations**: Use the search bar to find specific places
3. **Filter Markers**: Use the filter buttons to show specific types of locations
4. **View Details**: Click on map markers to see location information

### Flight and Hotel Search

1. **Search Flights**: Use the flight search functionality (demo data)
2. **Filter Results**: Apply filters for price, airlines, stops, etc.
3. **View Details**: Click on flights to see detailed information
4. **Add to Itinerary**: Include flights in your travel plans

## 🔧 Configuration

### API Integration

The application is designed to work with real APIs. To integrate with actual services:

1. **Flight APIs**: Update `FlightService.js` to use real APIs like:
   - Kiwi.com (Tequila API)
   - Amadeus Travel API
   - Skyscanner API

2. **Hotel APIs**: Update `HotelService.js` to use:
   - Amadeus Hotel API
   - Booking.com API
   - TripAdvisor API

3. **Location APIs**: Update `LocationService.js` to use:
   - Google Places API
   - Foursquare API
   - OpenWeather API

### Environment Variables

Create a `.env` file for API keys:

```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
VITE_AMADEUS_API_KEY=your_amadeus_key
VITE_KIWI_API_KEY=your_kiwi_key
```

## 🎨 Design System

### Color Palette
- **Primary**: Deep Blue (#1A3C40)
- **Secondary**: Coral (#FF6B6B)
- **Accent**: Teal (#4ECDC4)
- **Background**: Cream (#FFF2E6)

### Typography
- **Headings**: Montserrat (400, 600, 700)
- **Body**: Open Sans (300, 400, 500, 600)

### Components
- Responsive grid system
- Consistent button styles
- Card-based layouts
- Modal dialogs
- Toast notifications

## 🧪 Testing

Run the linter:
```bash
npm run lint
```

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Leaflet.js** for the interactive maps
- **Font Awesome** for the beautiful icons
- **Google Fonts** for typography
- **Vite** for the excellent build tool
- **Unsplash** for placeholder images

## 🐛 Known Issues

- Map markers may not display correctly on first load (refresh to fix)
- Some API calls use mock data for demonstration purposes
- Export functionality requires additional PDF library integration

## 🔮 Future Enhancements

- Real-time collaboration on trip planning
- Integration with calendar applications
- Weather forecasts for destinations
- Currency conversion
- Travel document management
- Social features and trip sharing
- Mobile app development
- AI-powered trip recommendations

## 📞 Support

For support, please open an issue on the GitHub repository or contact the development team.

---

**Happy Traveling! ✈️🗺️** 