/**
 * Storage Manager Module
 * Handles localStorage operations and data persistence
 */
import { Logger } from '../utils/Logger.js';

export class StorageManager {
    constructor() {
        this.logger = new Logger('StorageManager');
        this.prefix = 'travelapp_';
        this.isAvailable = this.checkStorageAvailability();
        
        this.logger.info('StorageManager initialized', { available: this.isAvailable });
    }

    /**
     * Check if localStorage is available
     */
    checkStorageAvailability() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            this.logger.warn('localStorage not available', error);
            return false;
        }
    }

    /**
     * Get item from storage
     */
    getItem(key) {
        if (!this.isAvailable) return null;

        try {
            const item = localStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            this.logger.error(`Failed to get item: ${key}`, error);
            return null;
        }
    }

    /**
     * Set item in storage
     */
    setItem(key, value) {
        if (!this.isAvailable) return false;

        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(value));
            return true;
        } catch (error) {
            this.logger.error(`Failed to set item: ${key}`, error);
            return false;
        }
    }

    /**
     * Remove item from storage
     */
    removeItem(key) {
        if (!this.isAvailable) return false;

        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        } catch (error) {
            this.logger.error(`Failed to remove item: ${key}`, error);
            return false;
        }
    }

    /**
     * Clear all app data
     */
    clear() {
        if (!this.isAvailable) return false;

        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            this.logger.error('Failed to clear storage', error);
            return false;
        }
    }

    /**
     * Get user data
     */
    getUserData() {
        return this.getItem('user');
    }

    /**
     * Set user data
     */
    setUserData(userData) {
        return this.setItem('user', userData);
    }

    /**
     * Get user trips
     */
    getUserTrips() {
        return this.getItem('trips') || [];
    }

    /**
     * Set user trips
     */
    setUserTrips(trips) {
        return this.setItem('trips', trips);
    }

    /**
     * Get favorites
     */
    getFavorites() {
        return this.getItem('favorites') || [];
    }

    /**
     * Set favorites
     */
    setFavorites(favorites) {
        return this.setItem('favorites', favorites);
    }
} 