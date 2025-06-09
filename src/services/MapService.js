import { Logger } from '../utils/Logger.js';

/**
 * MapService - Handles map integration using Leaflet
 * Provides interactive mapping functionality for the travel planner
 */
export class MapService {
    constructor() {
        this.logger = new Logger('MapService');
        this.map = null;
        this.markers = new Map();
        this.routes = new Map();
        this.currentLocation = null;
        
        // Map configuration
        this.config = {
            defaultCenter: [40.7128, -74.0060], // New York City
            defaultZoom: 13,
            maxZoom: 18,
            minZoom: 2,
            tileLayer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            attribution: '© OpenStreetMap contributors'
        };
        
        // Custom marker icons
        this.icons = {
            hotel: this.createCustomIcon('🏨', '#FF6B6B'),
            restaurant: this.createCustomIcon('🍽️', '#4ECDC4'),
            attraction: this.createCustomIcon('🎯', '#1A3C40'),
            flight: this.createCustomIcon('✈️', '#FF6B6B'),
            user: this.createCustomIcon('📍', '#FFF2E6'),
            waypoint: this.createCustomIcon('📌', '#4ECDC4')
        };
        
        this.logger.info('MapService initialized');
    }

    /**
     * Initialize the map in a container element
     * @param {string} containerId - ID of the container element
     * @param {Object} options - Map initialization options
     * @returns {Promise<void>}
     */
    async initializeMap(containerId, options = {}) {
        try {
            this.logger.info('Initializing map', { containerId, options });
            
            // Check if Leaflet is loaded
            if (typeof L === 'undefined') {
                throw new Error('Leaflet library not loaded');
            }

            const container = document.getElementById(containerId);
            if (!container) {
                throw new Error(`Container element with ID '${containerId}' not found`);
            }

            // Merge options with defaults
            const mapOptions = {
                center: options.center || this.config.defaultCenter,
                zoom: options.zoom || this.config.defaultZoom,
                maxZoom: this.config.maxZoom,
                minZoom: this.config.minZoom,
                zoomControl: options.zoomControl !== false,
                attributionControl: options.attributionControl !== false
            };

            // Create the map
            this.map = L.map(containerId, mapOptions);

            // Add tile layer
            L.tileLayer(this.config.tileLayer, {
                attribution: this.config.attribution,
                maxZoom: this.config.maxZoom
            }).addTo(this.map);

            // Add map event listeners
            this.setupMapEventListeners();

            // Try to get user's current location
            if (options.showUserLocation !== false) {
                await this.getCurrentLocation();
            }

            this.logger.info('Map initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize map', { error: error.message, containerId });
            throw new Error(`Failed to initialize map: ${error.message}`);
        }
    }

    /**
     * Add a marker to the map
     * @param {Object} markerData - Marker data
     * @param {Array} markerData.coordinates - [lat, lng]
     * @param {string} markerData.type - Marker type (hotel, restaurant, etc.)
     * @param {string} markerData.title - Marker title
     * @param {string} markerData.description - Marker description
     * @param {Object} markerData.data - Additional marker data
     * @returns {string} Marker ID
     */
    addMarker(markerData) {
        try {
            if (!this.map) {
                throw new Error('Map not initialized');
            }

            const markerId = `marker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const [lat, lng] = markerData.coordinates;

            // Validate coordinates
            if (typeof lat !== 'number' || typeof lng !== 'number') {
                throw new Error('Invalid coordinates');
            }

            // Create marker with custom icon
            const icon = this.icons[markerData.type] || this.icons.waypoint;
            const marker = L.marker([lat, lng], { icon }).addTo(this.map);

            // Create popup content
            const popupContent = this.createPopupContent(markerData);
            marker.bindPopup(popupContent);

            // Store marker reference
            this.markers.set(markerId, {
                marker,
                data: markerData
            });

            this.logger.info('Marker added', { markerId, type: markerData.type, coordinates: [lat, lng] });
            return markerId;
            
        } catch (error) {
            this.logger.error('Failed to add marker', { error: error.message, markerData });
            throw new Error(`Failed to add marker: ${error.message}`);
        }
    }

    /**
     * Remove a marker from the map
     * @param {string} markerId - Marker ID
     */
    removeMarker(markerId) {
        try {
            const markerInfo = this.markers.get(markerId);
            if (markerInfo) {
                this.map.removeLayer(markerInfo.marker);
                this.markers.delete(markerId);
                this.logger.info('Marker removed', { markerId });
            }
        } catch (error) {
            this.logger.error('Failed to remove marker', { error: error.message, markerId });
        }
    }

    /**
     * Clear all markers from the map
     * @param {string} type - Optional: only clear markers of specific type
     */
    clearMarkers(type = null) {
        try {
            for (const [markerId, markerInfo] of this.markers.entries()) {
                if (!type || markerInfo.data.type === type) {
                    this.map.removeLayer(markerInfo.marker);
                    this.markers.delete(markerId);
                }
            }
            this.logger.info('Markers cleared', { type });
        } catch (error) {
            this.logger.error('Failed to clear markers', { error: error.message, type });
        }
    }

    /**
     * Add a route between multiple points
     * @param {Array} waypoints - Array of [lat, lng] coordinates
     * @param {Object} options - Route options
     * @returns {string} Route ID
     */
    async addRoute(waypoints, options = {}) {
        try {
            if (!this.map) {
                throw new Error('Map not initialized');
            }

            if (!waypoints || waypoints.length < 2) {
                throw new Error('At least 2 waypoints required for a route');
            }

            const routeId = `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // For demo purposes, create a simple polyline
            // In production, you would use a routing service like OpenRouteService or Mapbox
            const routeCoordinates = await this.calculateRoute(waypoints);
            
            const polyline = L.polyline(routeCoordinates, {
                color: options.color || '#FF6B6B',
                weight: options.weight || 4,
                opacity: options.opacity || 0.7
            }).addTo(this.map);

            // Add waypoint markers
            waypoints.forEach((point, index) => {
                const isStart = index === 0;
                const isEnd = index === waypoints.length - 1;
                const markerType = isStart ? 'start' : (isEnd ? 'end' : 'waypoint');
                
                const marker = L.marker(point, {
                    icon: this.createWaypointIcon(markerType)
                }).addTo(this.map);

                polyline.bindPopup(`${isStart ? 'Start' : isEnd ? 'End' : 'Waypoint'} ${index + 1}`);
            });

            // Store route reference
            this.routes.set(routeId, {
                polyline,
                waypoints,
                options
            });

            // Fit map to route bounds
            if (options.fitBounds !== false) {
                this.map.fitBounds(polyline.getBounds(), { padding: [20, 20] });
            }

            this.logger.info('Route added', { routeId, waypointCount: waypoints.length });
            return routeId;
            
        } catch (error) {
            this.logger.error('Failed to add route', { error: error.message, waypoints });
            throw new Error(`Failed to add route: ${error.message}`);
        }
    }

    /**
     * Remove a route from the map
     * @param {string} routeId - Route ID
     */
    removeRoute(routeId) {
        try {
            const routeInfo = this.routes.get(routeId);
            if (routeInfo) {
                this.map.removeLayer(routeInfo.polyline);
                this.routes.delete(routeId);
                this.logger.info('Route removed', { routeId });
            }
        } catch (error) {
            this.logger.error('Failed to remove route', { error: error.message, routeId });
        }
    }

    /**
     * Center map on specific coordinates
     * @param {Array} coordinates - [lat, lng]
     * @param {number} zoom - Optional zoom level
     */
    centerMap(coordinates, zoom = null) {
        try {
            if (!this.map) {
                throw new Error('Map not initialized');
            }

            const [lat, lng] = coordinates;
            if (typeof lat !== 'number' || typeof lng !== 'number') {
                throw new Error('Invalid coordinates');
            }

            if (zoom !== null) {
                this.map.setView([lat, lng], zoom);
            } else {
                this.map.panTo([lat, lng]);
            }

            this.logger.info('Map centered', { coordinates, zoom });
            
        } catch (error) {
            this.logger.error('Failed to center map', { error: error.message, coordinates });
        }
    }

    /**
     * Fit map to show all markers
     */
    fitToMarkers() {
        try {
            if (!this.map || this.markers.size === 0) {
                return;
            }

            const group = new L.featureGroup();
            for (const markerInfo of this.markers.values()) {
                group.addLayer(markerInfo.marker);
            }

            this.map.fitBounds(group.getBounds(), { padding: [20, 20] });
            this.logger.info('Map fitted to markers');
            
        } catch (error) {
            this.logger.error('Failed to fit map to markers', { error: error.message });
        }
    }

    /**
     * Get user's current location
     * @private
     */
    async getCurrentLocation() {
        try {
            if (!navigator.geolocation) {
                this.logger.warn('Geolocation not supported');
                return;
            }

            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutes
                });
            });

            const { latitude, longitude } = position.coords;
            this.currentLocation = [latitude, longitude];

            // Add user location marker
            this.addMarker({
                coordinates: [latitude, longitude],
                type: 'user',
                title: 'Your Location',
                description: 'Your current location'
            });

            this.logger.info('Current location obtained', { coordinates: this.currentLocation });
            
        } catch (error) {
            this.logger.warn('Failed to get current location', { error: error.message });
        }
    }

    /**
     * Setup map event listeners
     * @private
     */
    setupMapEventListeners() {
        if (!this.map) return;

        this.map.on('click', (e) => {
            this.logger.debug('Map clicked', { coordinates: [e.latlng.lat, e.latlng.lng] });
            
            // Dispatch custom event for map clicks
            const event = new CustomEvent('mapClick', {
                detail: {
                    coordinates: [e.latlng.lat, e.latlng.lng],
                    originalEvent: e
                }
            });
            document.dispatchEvent(event);
        });

        this.map.on('zoomend', () => {
            this.logger.debug('Map zoom changed', { zoom: this.map.getZoom() });
        });

        this.map.on('moveend', () => {
            const center = this.map.getCenter();
            this.logger.debug('Map moved', { center: [center.lat, center.lng] });
        });
    }

    /**
     * Create custom icon for markers
     * @private
     */
    createCustomIcon(emoji, color) {
        return L.divIcon({
            html: `<div style="
                background-color: ${color};
                width: 30px;
                height: 30px;
                border-radius: 50%;
                border: 2px solid white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            ">${emoji}</div>`,
            className: 'custom-marker',
            iconSize: [30, 30],
            iconAnchor: [15, 15],
            popupAnchor: [0, -15]
        });
    }

    /**
     * Create waypoint icon
     * @private
     */
    createWaypointIcon(type) {
        const colors = {
            start: '#4ECDC4',
            end: '#FF6B6B',
            waypoint: '#1A3C40'
        };

        const symbols = {
            start: 'A',
            end: 'B',
            waypoint: '•'
        };

        return L.divIcon({
            html: `<div style="
                background-color: ${colors[type]};
                width: 24px;
                height: 24px;
                border-radius: 50%;
                border: 2px solid white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: bold;
                color: white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            ">${symbols[type]}</div>`,
            className: 'waypoint-marker',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
    }

    /**
     * Create popup content for markers
     * @private
     */
    createPopupContent(markerData) {
        const { title, description, data } = markerData;
        
        let content = `<div class="marker-popup">
            <h4>${title}</h4>
            <p>${description}</p>`;

        if (data) {
            if (data.rating) {
                content += `<div class="rating">⭐ ${data.rating}</div>`;
            }
            if (data.price) {
                content += `<div class="price">💰 ${data.price}</div>`;
            }
            if (data.address) {
                content += `<div class="address">📍 ${data.address}</div>`;
            }
        }

        content += '</div>';
        return content;
    }

    /**
     * Calculate route between waypoints (mock implementation)
     * @private
     */
    async calculateRoute(waypoints) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // For demo purposes, return a simple path between waypoints
        // In production, you would use a routing service
        const routeCoordinates = [];
        
        for (let i = 0; i < waypoints.length - 1; i++) {
            const start = waypoints[i];
            const end = waypoints[i + 1];
            
            // Add start point
            routeCoordinates.push(start);
            
            // Add intermediate points for a more realistic route
            const steps = 5;
            for (let j = 1; j < steps; j++) {
                const ratio = j / steps;
                const lat = start[0] + (end[0] - start[0]) * ratio;
                const lng = start[1] + (end[1] - start[1]) * ratio;
                routeCoordinates.push([lat, lng]);
            }
        }
        
        // Add final point
        routeCoordinates.push(waypoints[waypoints.length - 1]);
        
        return routeCoordinates;
    }

    /**
     * Get map bounds
     * @returns {Object} Map bounds
     */
    getMapBounds() {
        if (!this.map) return null;
        
        const bounds = this.map.getBounds();
        return {
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest()
        };
    }

    /**
     * Destroy the map and clean up resources
     */
    destroy() {
        try {
            if (this.map) {
                this.map.remove();
                this.map = null;
            }
            
            this.markers.clear();
            this.routes.clear();
            this.currentLocation = null;
            
            this.logger.info('Map destroyed and resources cleaned up');
            
        } catch (error) {
            this.logger.error('Failed to destroy map', { error: error.message });
        }
    }
} 