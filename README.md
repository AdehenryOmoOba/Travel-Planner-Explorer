# Travel Planner & Explorer

A comprehensive travel planning platform built with vanilla JavaScript, HTML, and CSS. This application provides a complete travel planning experience with itinerary management, destination exploration, trip organization, and interactive maps.

## 🌟 Features

### ✈️ Trip Planning & Management
- **Smart Trip Creation**: Create trips with destination-based naming and automatic organization
- **Interactive Itinerary Builder**: Detailed day-by-day planning with time slot management (Morning, Afternoon, Evening, Night)
- **Add to Trip Functionality**: Add destinations from anywhere in the app to your current trip
- **Trip Status Tracking**: Visual indicators for upcoming, active, and completed trips
- **Trip Progress Monitoring**: Track planned activities and completion status
- **Budget Integration**: Display and manage trip budgets
- **Trip Deletion**: Remove trips with confirmation dialogs
- **Auto-Destination Naming**: Trips automatically named after first added location

### 🗺️ Destination Discovery
- **Popular Destinations**: Curated collection of trending travel spots with weather integration
- **Advanced Search**: Comprehensive location search with real-time results
- **Explore Page**: Dedicated exploration interface with detailed destination information
- **Location Details**: Rich information including facts, transportation, and safety tips
- **Interactive Cards**: Modern card-based UI with ratings, highlights, and action buttons
- **Weather Integration**: Real-time weather data for destinations
- **Image Galleries**: High-quality destination imagery from Unsplash

### 🛫 Travel Services
- **Flight Search**: Comprehensive flight search with filtering and comparison
- **Hotel Finder**: Accommodation search with detailed amenities and ratings
- **Location Services**: Points of interest, attractions, and local recommendations
- **Real-time Data**: Integration-ready for live flight and hotel APIs

### 🗺️ Interactive Maps
- **Leaflet-powered Maps**: Interactive mapping with custom markers
- **Location Visualization**: View destinations and points of interest
- **Map Filtering**: Filter markers by category and type
- **Search Integration**: Search locations directly on the map
- **Responsive Design**: Mobile-optimized map interactions

### 🎨 Modern User Interface
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Modern Card Layouts**: Beautiful gradient cards with hover effects and animations
- **Status Indicators**: Color-coded trip statuses and progress bars
- **Interactive Elements**: Smooth transitions, hover effects, and modern styling
- **Modal Dialogs**: Trip creation modal with comprehensive form inputs
- **Toast Notifications**: User-friendly feedback system
- **Dark/Light Themes**: Consistent color scheme throughout the application

### 🔐 User Management
- **Authentication System**: Secure login and registration
- **Profile Management**: User profile with trip history
- **Local Storage**: Persistent data storage for user preferences and trips
- **Guest Mode**: Basic functionality without account requirement

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Build Tool**: Vite for development and production builds
- **Maps**: Leaflet.js for interactive mapping
- **HTTP Client**: Axios for API communications
- **Icons**: Font Awesome for comprehensive iconography
- **Fonts**: Google Fonts (Montserrat, Open Sans)
- **Architecture**: Modular ES6 architecture with clean separation of concerns
- **Styling**: CSS Grid, Flexbox, Custom Properties, and modern CSS features

## 🚀 Getting Started

### Prerequisites
- Node.js (version 16 or higher)
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

### Linting

```bash
npm run lint
```

## 📁 Project Structure

```
Travel-Planner-Explorer/
├── index.html                 # Main HTML file with all pages
├── package.json              # Dependencies and scripts
├── vite.config.js            # Vite configuration
├── .eslintrc.js              # ESLint configuration
├── .gitignore                # Git ignore patterns
├── debug.html                # Debug interface
├── test.html                 # Testing interface
├── DEVELOPMENT.md            # Development documentation
├── src/
│   ├── main.js               # Application entry point and main logic
│   ├── styles/
│   │   └── main.css          # Comprehensive stylesheet with modern design
│   ├── modules/              # Core application modules
│   │   ├── AuthenticationManager.js    # User authentication
│   │   ├── ItineraryManager.js         # Trip and itinerary management
│   │   ├── NavigationManager.js        # SPA routing and navigation
│   │   ├── StorageManager.js           # Local storage management
│   │   └── UIManager.js                # UI utilities and interactions
│   ├── services/             # API service modules
│   │   ├── FlightService.js            # Flight search and data
│   │   ├── HotelService.js             # Hotel search and data
│   │   ├── LocationService.js          # Location and destination data
│   │   └── MapService.js               # Map functionality and markers
│   ├── utils/                # Utility functions
│   │   └── Logger.js                   # Application logging
│   └── config/               # Configuration files
├── images/                   # Static image assets
└── README.md
```

## 🎯 Usage Guide

### Creating Your First Trip

1. **Access Trip Planner**: Navigate to "My Trips" in the main navigation
2. **Create New Trip**: Click the "New Trip" button to open the trip creation modal
3. **Enter Trip Details**: 
   - Destination city/country
   - Trip dates (start and end)
   - Trip type (Business, Leisure, Adventure, etc.)
   - Optional budget
4. **Start Planning**: Your new trip will appear in the sidebar, ready for planning

### Adding Destinations to Trips

1. **From Popular Destinations**: Click "Add to Trip" on any destination card on the home page
2. **From Search Results**: Search for locations and click "Add to Trip" on results
3. **From Explore Page**: Browse destinations and add them directly to your current trip
4. **Automatic Trip Creation**: If no trip exists, the app will prompt you to create one

### Managing Your Itinerary

1. **Select a Trip**: Click on any trip card in the sidebar to view its itinerary
2. **View Trip Details**: See comprehensive trip information including:
   - Trip status and destination
   - Duration and dates
   - Number of planned activities
   - Budget information
3. **Day-by-Day Planning**: Each day is organized into time slots:
   - **Morning** (6:00 AM - 12:00 PM)
   - **Afternoon** (12:00 PM - 6:00 PM)
   - **Evening** (6:00 PM - 10:00 PM)
   - **Night** (10:00 PM - 6:00 AM)
4. **Add Activities**: Use the "Add Item" buttons within each time slot
5. **Edit/Remove Items**: Use the action buttons on each itinerary item

### Exploring Destinations

1. **Home Page Search**: Use the hero search bar to find destinations
2. **Explore Page**: Navigate to the Explore page for dedicated destination browsing
3. **Filter and Browse**: Use category filters to find specific types of attractions
4. **View Details**: Click "Explore" on any destination for detailed information
5. **Weather Information**: View current weather conditions for destinations

### Using the Interactive Map

1. **Navigate to Map**: Click "Map" in the main navigation
2. **Search Locations**: Use the map search functionality
3. **Filter Markers**: Use filter buttons to show specific location types
4. **View Location Details**: Click on map markers for detailed information
5. **Add to Trip**: Add locations directly from the map to your itinerary

### Trip Management Features

1. **Trip Status**: Visual indicators show trip status (upcoming, active, completed)
2. **Progress Tracking**: See how many activities you've planned
3. **Trip Actions**: Edit trip details, export itinerary, or delete trips
4. **Budget Monitoring**: Track estimated costs and budget allocation

## 🔧 Configuration

### API Integration

The application is designed for easy integration with real travel APIs:

1. **Flight APIs**: 
   - Amadeus Travel API
   - Kiwi.com (Tequila API)
   - Skyscanner API

2. **Hotel APIs**:
   - Amadeus Hotel API
   - Booking.com API
   - Hotels.com API

3. **Location APIs**:
   - Google Places API
   - Foursquare API
   - OpenWeather API

### Environment Variables

Create a `.env` file for API keys:

```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
VITE_AMADEUS_API_KEY=your_amadeus_key
VITE_KIWI_API_KEY=your_kiwi_key
VITE_OPENWEATHER_API_KEY=your_openweather_key
```

## 🎨 Design System

### Color Palette
- **Primary**: Deep Blue (#1A3C40) - Navigation and primary actions
- **Secondary**: Coral (#FF6B6B) - Accent colors and highlights
- **Accent**: Teal (#4ECDC4) - Interactive elements and success states
- **Background**: Cream (#FFF2E6) - Card backgrounds and highlights
- **Text**: Dark Gray (#2c3e50) - Primary text
- **Light Text**: Medium Gray (#7f8c8d) - Secondary text

### Typography
- **Headings**: Montserrat (400, 600, 700) - Clean, modern headings
- **Body**: Open Sans (300, 400, 500, 600) - Readable body text

### UI Components
- **Responsive Grid System**: CSS Grid and Flexbox layouts
- **Modern Card Design**: Gradient backgrounds, shadows, and hover effects
- **Interactive Buttons**: Multiple button styles with hover animations
- **Modal Dialogs**: Centered modals with backdrop blur
- **Toast Notifications**: Non-intrusive user feedback
- **Progress Indicators**: Visual progress bars and status badges
- **Form Elements**: Consistent styling across all inputs

### Responsive Design
- **Mobile-First**: Optimized for mobile devices
- **Tablet Support**: Adapted layouts for tablet screens
- **Desktop Enhancement**: Full-featured desktop experience
- **Touch-Friendly**: Large touch targets and gesture support

## 🧪 Testing & Development

### Development Tools
- **Hot Module Replacement**: Instant updates during development
- **ESLint Integration**: Code quality and consistency checking
- **Debug Interface**: Dedicated debug page for testing features
- **Console Logging**: Comprehensive logging system with different levels

### Browser Support
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

## 🚀 Key Features Implemented

### Recent Enhancements
- ✅ **Smart Trip Creation**: Modal-based trip creation with destination input
- ✅ **Universal Add to Trip**: Add destinations from any page in the app
- ✅ **Modern Trip Cards**: Redesigned with status indicators and progress tracking
- ✅ **Enhanced Itinerary Builder**: Comprehensive trip details with statistics
- ✅ **Trip Deletion**: Safe trip removal with confirmation
- ✅ **Destination-Based Naming**: Automatic trip naming based on first location
- ✅ **Weather Integration**: Real-time weather data for destinations
- ✅ **Responsive Explore Page**: Fully functional destination exploration
- ✅ **Error Handling**: Comprehensive error handling and user feedback
- ✅ **Image Optimization**: Proper image loading with fallbacks

### Core Functionality
- ✅ **Single Page Application**: Smooth navigation between pages
- ✅ **Local Storage**: Persistent data storage
- ✅ **Authentication System**: User registration and login
- ✅ **Interactive Maps**: Leaflet.js integration with custom markers
- ✅ **Search Functionality**: Real-time search with caching
- ✅ **Mobile Responsive**: Optimized for all screen sizes

## 🔮 Future Enhancements

### Planned Features
- **Real-time Collaboration**: Share and collaborate on trip planning
- **Calendar Integration**: Sync with Google Calendar and other calendar apps
- **Advanced Export Options**: PDF itineraries, calendar exports
- **Social Features**: Share trips and get recommendations
- **Offline Support**: Progressive Web App capabilities
- **AI Recommendations**: Smart destination and activity suggestions
- **Currency Conversion**: Real-time currency conversion for budgets
- **Travel Documents**: Passport and visa requirement tracking
- **Group Planning**: Multi-user trip planning and coordination

### Technical Improvements
- **Performance Optimization**: Lazy loading and code splitting
- **Advanced Caching**: Service worker implementation
- **Real API Integration**: Connect to live travel service APIs
- **Testing Suite**: Comprehensive unit and integration tests
- **Accessibility**: Enhanced WCAG compliance
- **Internationalization**: Multi-language support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style and patterns
- Write descriptive commit messages
- Add comments for complex functionality
- Test your changes across different screen sizes
- Ensure accessibility compliance

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Leaflet.js** - Interactive mapping solution
- **Font Awesome** - Comprehensive icon library
- **Google Fonts** - Beautiful typography
- **Vite** - Fast and modern build tool
- **Unsplash** - High-quality destination imagery
- **OpenWeather** - Weather data integration
- **Axios** - HTTP client for API communications

## 🐛 Known Issues & Limitations

### Current Limitations
- Uses mock data for demonstration (designed for easy API integration)
- Map markers may require refresh on initial load
- Export functionality requires additional PDF library integration
- Some advanced features are prepared but not fully implemented

### Browser Compatibility
- Internet Explorer is not supported
- Some CSS features require modern browser support
- JavaScript ES6+ features are used throughout

## 📞 Support & Documentation

- **Issues**: Report bugs and request features on GitHub
- **Development**: See `DEVELOPMENT.md` for detailed development information
- **Testing**: Use `debug.html` for testing individual features

---

**Ready to explore the world? Start planning your next adventure! ✈️🗺️🌍** 