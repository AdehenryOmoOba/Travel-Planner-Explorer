import { Logger } from '../utils/Logger.js';
import { StorageManager } from './StorageManager.js';

/**
 * ItineraryManager - Handles trip planning and itinerary management
 * Provides comprehensive itinerary creation, editing, and organization features
 */
export class ItineraryManager {
    constructor() {
        this.logger = new Logger('ItineraryManager');
        this.storageManager = new StorageManager();
        this.currentItinerary = null;
        this.itineraries = new Map();
        
        // Itinerary templates for different trip types
        this.templates = {
            business: {
                name: 'Business Trip',
                defaultDuration: 3,
                categories: ['meetings', 'dining', 'transportation', 'accommodation'],
                timeSlots: ['morning', 'afternoon', 'evening']
            },
            leisure: {
                name: 'Leisure Trip',
                defaultDuration: 7,
                categories: ['attractions', 'dining', 'shopping', 'entertainment', 'relaxation'],
                timeSlots: ['morning', 'afternoon', 'evening']
            },
            family: {
                name: 'Family Vacation',
                defaultDuration: 5,
                categories: ['family-attractions', 'dining', 'activities', 'rest'],
                timeSlots: ['morning', 'afternoon', 'evening']
            },
            adventure: {
                name: 'Adventure Trip',
                defaultDuration: 10,
                categories: ['outdoor-activities', 'hiking', 'dining', 'accommodation'],
                timeSlots: ['early-morning', 'morning', 'afternoon', 'evening']
            }
        };
        
        this.logger.info('ItineraryManager initialized');
        this.loadItineraries();
    }

    /**
     * Create a new itinerary
     * @param {Object} itineraryData - Itinerary creation data
     * @param {string} itineraryData.title - Itinerary title
     * @param {string} itineraryData.destination - Destination
     * @param {string} itineraryData.startDate - Start date (YYYY-MM-DD)
     * @param {string} itineraryData.endDate - End date (YYYY-MM-DD)
     * @param {string} itineraryData.type - Trip type (business, leisure, family, adventure)
     * @param {Object} itineraryData.preferences - User preferences
     * @returns {Promise<Object>} Created itinerary
     */
    async createItinerary(itineraryData) {
        try {
            this.logger.info('Creating new itinerary', { itineraryData });
            
            // Validate itinerary data
            this.validateItineraryData(itineraryData);
            
            const itineraryId = `itinerary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const template = this.templates[itineraryData.type] || this.templates.leisure;
            
            // Calculate trip duration
            const startDate = new Date(itineraryData.startDate);
            const endDate = new Date(itineraryData.endDate);
            const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
            
            // Create itinerary structure
            const itinerary = {
                id: itineraryId,
                title: itineraryData.title,
                destination: itineraryData.destination,
                startDate: itineraryData.startDate,
                endDate: itineraryData.endDate,
                duration,
                type: itineraryData.type,
                template: template.name,
                preferences: itineraryData.preferences || {},
                status: 'draft',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                days: this.generateDayStructure(duration, startDate, template),
                budget: {
                    total: itineraryData.budget || 0,
                    spent: 0,
                    categories: {}
                },
                travelers: itineraryData.travelers || 1,
                notes: itineraryData.notes || '',
                tags: itineraryData.tags || [],
                sharing: {
                    isPublic: false,
                    collaborators: []
                }
            };
            
            // Store itinerary
            this.itineraries.set(itineraryId, itinerary);
            this.currentItinerary = itinerary;
            await this.saveItineraries();
            
            this.logger.info('Itinerary created successfully', { 
                itineraryId, 
                title: itinerary.title,
                duration: itinerary.duration
            });
            
            return itinerary;
            
        } catch (error) {
            this.logger.error('Failed to create itinerary', { error: error.message, itineraryData });
            throw new Error(`Failed to create itinerary: ${error.message}`);
        }
    }

    /**
     * Add an item to a specific day and time slot
     * @param {string} itineraryId - Itinerary ID
     * @param {number} dayIndex - Day index (0-based)
     * @param {string} timeSlot - Time slot (morning, afternoon, evening)
     * @param {Object} item - Item to add
     * @returns {Promise<Object>} Updated itinerary
     */
    async addItemToDay(itineraryId, dayIndex, timeSlot, item) {
        try {
            this.logger.info('Adding item to itinerary day', { itineraryId, dayIndex, timeSlot, item });
            
            const itinerary = this.itineraries.get(itineraryId);
            if (!itinerary) {
                throw new Error('Itinerary not found');
            }
            
            if (dayIndex < 0 || dayIndex >= itinerary.days.length) {
                throw new Error('Invalid day index');
            }
            
            const day = itinerary.days[dayIndex];
            if (!day.timeSlots[timeSlot]) {
                throw new Error('Invalid time slot');
            }
            
            // Create item with unique ID
            const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const itineraryItem = {
                id: itemId,
                ...item,
                addedAt: new Date().toISOString(),
                status: 'planned'
            };
            
            // Add item to time slot
            day.timeSlots[timeSlot].items.push(itineraryItem);
            
            // Update budget if item has cost
            if (item.cost) {
                itinerary.budget.spent += item.cost;
                const category = item.category || 'miscellaneous';
                itinerary.budget.categories[category] = (itinerary.budget.categories[category] || 0) + item.cost;
            }
            
            // Update itinerary metadata
            itinerary.updatedAt = new Date().toISOString();
            
            await this.saveItineraries();
            
            this.logger.info('Item added to itinerary successfully', { itineraryId, itemId, dayIndex, timeSlot });
            return itinerary;
            
        } catch (error) {
            this.logger.error('Failed to add item to itinerary', { error: error.message, itineraryId, dayIndex, timeSlot });
            throw new Error(`Failed to add item to itinerary: ${error.message}`);
        }
    }

    /**
     * Remove an item from the itinerary
     * @param {string} itineraryId - Itinerary ID
     * @param {string} itemId - Item ID to remove
     * @returns {Promise<Object>} Updated itinerary
     */
    async removeItem(itineraryId, itemId) {
        try {
            this.logger.info('Removing item from itinerary', { itineraryId, itemId });
            
            const itinerary = this.itineraries.get(itineraryId);
            if (!itinerary) {
                throw new Error('Itinerary not found');
            }
            
            let itemFound = false;
            let removedItem = null;
            
            // Find and remove the item
            for (const day of itinerary.days) {
                for (const timeSlot of Object.values(day.timeSlots)) {
                    const itemIndex = timeSlot.items.findIndex(item => item.id === itemId);
                    if (itemIndex !== -1) {
                        removedItem = timeSlot.items.splice(itemIndex, 1)[0];
                        itemFound = true;
                        break;
                    }
                }
                if (itemFound) break;
            }
            
            if (!itemFound) {
                throw new Error('Item not found in itinerary');
            }
            
            // Update budget if item had cost
            if (removedItem.cost) {
                itinerary.budget.spent -= removedItem.cost;
                const category = removedItem.category || 'miscellaneous';
                itinerary.budget.categories[category] = Math.max(0, (itinerary.budget.categories[category] || 0) - removedItem.cost);
            }
            
            // Update itinerary metadata
            itinerary.updatedAt = new Date().toISOString();
            
            await this.saveItineraries();
            
            this.logger.info('Item removed from itinerary successfully', { itineraryId, itemId });
            return itinerary;
            
        } catch (error) {
            this.logger.error('Failed to remove item from itinerary', { error: error.message, itineraryId, itemId });
            throw new Error(`Failed to remove item from itinerary: ${error.message}`);
        }
    }

    /**
     * Update an existing item in the itinerary
     * @param {string} itineraryId - Itinerary ID
     * @param {string} itemId - Item ID to update
     * @param {Object} updates - Updates to apply
     * @returns {Promise<Object>} Updated itinerary
     */
    async updateItem(itineraryId, itemId, updates) {
        try {
            this.logger.info('Updating itinerary item', { itineraryId, itemId, updates });
            
            const itinerary = this.itineraries.get(itineraryId);
            if (!itinerary) {
                throw new Error('Itinerary not found');
            }
            
            let itemFound = false;
            let targetItem = null;
            
            // Find the item to update
            for (const day of itinerary.days) {
                for (const timeSlot of Object.values(day.timeSlots)) {
                    targetItem = timeSlot.items.find(item => item.id === itemId);
                    if (targetItem) {
                        itemFound = true;
                        break;
                    }
                }
                if (itemFound) break;
            }
            
            if (!itemFound) {
                throw new Error('Item not found in itinerary');
            }
            
            // Update budget if cost changed
            if (updates.cost !== undefined && updates.cost !== targetItem.cost) {
                const oldCost = targetItem.cost || 0;
                const newCost = updates.cost || 0;
                const costDifference = newCost - oldCost;
                
                itinerary.budget.spent += costDifference;
                
                const category = updates.category || targetItem.category || 'miscellaneous';
                itinerary.budget.categories[category] = (itinerary.budget.categories[category] || 0) + costDifference;
            }
            
            // Apply updates
            Object.assign(targetItem, updates, {
                updatedAt: new Date().toISOString()
            });
            
            // Update itinerary metadata
            itinerary.updatedAt = new Date().toISOString();
            
            await this.saveItineraries();
            
            this.logger.info('Item updated successfully', { itineraryId, itemId });
            return itinerary;
            
        } catch (error) {
            this.logger.error('Failed to update item', { error: error.message, itineraryId, itemId });
            throw new Error(`Failed to update item: ${error.message}`);
        }
    }

    /**
     * Move an item to a different day or time slot
     * @param {string} itineraryId - Itinerary ID
     * @param {string} itemId - Item ID to move
     * @param {number} newDayIndex - New day index
     * @param {string} newTimeSlot - New time slot
     * @returns {Promise<Object>} Updated itinerary
     */
    async moveItem(itineraryId, itemId, newDayIndex, newTimeSlot) {
        try {
            this.logger.info('Moving itinerary item', { itineraryId, itemId, newDayIndex, newTimeSlot });
            
            const itinerary = this.itineraries.get(itineraryId);
            if (!itinerary) {
                throw new Error('Itinerary not found');
            }
            
            if (newDayIndex < 0 || newDayIndex >= itinerary.days.length) {
                throw new Error('Invalid day index');
            }
            
            const newDay = itinerary.days[newDayIndex];
            if (!newDay.timeSlots[newTimeSlot]) {
                throw new Error('Invalid time slot');
            }
            
            // Find and remove the item from its current location
            let itemFound = false;
            let targetItem = null;
            
            for (const day of itinerary.days) {
                for (const timeSlot of Object.values(day.timeSlots)) {
                    const itemIndex = timeSlot.items.findIndex(item => item.id === itemId);
                    if (itemIndex !== -1) {
                        targetItem = timeSlot.items.splice(itemIndex, 1)[0];
                        itemFound = true;
                        break;
                    }
                }
                if (itemFound) break;
            }
            
            if (!itemFound) {
                throw new Error('Item not found in itinerary');
            }
            
            // Add item to new location
            targetItem.movedAt = new Date().toISOString();
            newDay.timeSlots[newTimeSlot].items.push(targetItem);
            
            // Update itinerary metadata
            itinerary.updatedAt = new Date().toISOString();
            
            await this.saveItineraries();
            
            this.logger.info('Item moved successfully', { itineraryId, itemId, newDayIndex, newTimeSlot });
            return itinerary;
            
        } catch (error) {
            this.logger.error('Failed to move item', { error: error.message, itineraryId, itemId });
            throw new Error(`Failed to move item: ${error.message}`);
        }
    }

    /**
     * Get all itineraries for the current user
     * @returns {Array} Array of itineraries
     */
    getAllItineraries() {
        try {
            const itineraries = Array.from(this.itineraries.values());
            this.logger.info('Retrieved all itineraries', { count: itineraries.length });
            return itineraries;
        } catch (error) {
            this.logger.error('Failed to get all itineraries', { error: error.message });
            return [];
        }
    }

    /**
     * Get a specific itinerary by ID
     * @param {string} itineraryId - Itinerary ID
     * @returns {Object|null} Itinerary or null if not found
     */
    getItinerary(itineraryId) {
        try {
            const itinerary = this.itineraries.get(itineraryId);
            if (itinerary) {
                this.logger.info('Retrieved itinerary', { itineraryId, title: itinerary.title });
            } else {
                this.logger.warn('Itinerary not found', { itineraryId });
            }
            return itinerary || null;
        } catch (error) {
            this.logger.error('Failed to get itinerary', { error: error.message, itineraryId });
            return null;
        }
    }

    /**
     * Delete an itinerary
     * @param {string} itineraryId - Itinerary ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteItinerary(itineraryId) {
        try {
            this.logger.info('Deleting itinerary', { itineraryId });
            
            const itinerary = this.itineraries.get(itineraryId);
            if (!itinerary) {
                throw new Error('Itinerary not found');
            }
            
            this.itineraries.delete(itineraryId);
            
            if (this.currentItinerary && this.currentItinerary.id === itineraryId) {
                this.currentItinerary = null;
            }
            
            await this.saveItineraries();
            
            this.logger.info('Itinerary deleted successfully', { itineraryId });
            return true;
            
        } catch (error) {
            this.logger.error('Failed to delete itinerary', { error: error.message, itineraryId });
            throw new Error(`Failed to delete itinerary: ${error.message}`);
        }
    }

    /**
     * Duplicate an existing itinerary
     * @param {string} itineraryId - Source itinerary ID
     * @param {Object} updates - Optional updates for the new itinerary
     * @returns {Promise<Object>} New itinerary
     */
    async duplicateItinerary(itineraryId, updates = {}) {
        try {
            this.logger.info('Duplicating itinerary', { itineraryId, updates });
            
            const sourceItinerary = this.itineraries.get(itineraryId);
            if (!sourceItinerary) {
                throw new Error('Source itinerary not found');
            }
            
            const newItineraryId = `itinerary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Create deep copy of source itinerary
            const newItinerary = JSON.parse(JSON.stringify(sourceItinerary));
            
            // Update with new data
            newItinerary.id = newItineraryId;
            newItinerary.title = updates.title || `${sourceItinerary.title} (Copy)`;
            newItinerary.startDate = updates.startDate || sourceItinerary.startDate;
            newItinerary.endDate = updates.endDate || sourceItinerary.endDate;
            newItinerary.status = 'draft';
            newItinerary.createdAt = new Date().toISOString();
            newItinerary.updatedAt = new Date().toISOString();
            
            // Reset budget spent
            newItinerary.budget.spent = 0;
            newItinerary.budget.categories = {};
            
            // Generate new IDs for all items
            for (const day of newItinerary.days) {
                for (const timeSlot of Object.values(day.timeSlots)) {
                    for (const item of timeSlot.items) {
                        item.id = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                        item.status = 'planned';
                        delete item.completedAt;
                    }
                }
            }
            
            // Store new itinerary
            this.itineraries.set(newItineraryId, newItinerary);
            await this.saveItineraries();
            
            this.logger.info('Itinerary duplicated successfully', { 
                sourceId: itineraryId, 
                newId: newItineraryId 
            });
            
            return newItinerary;
            
        } catch (error) {
            this.logger.error('Failed to duplicate itinerary', { error: error.message, itineraryId });
            throw new Error(`Failed to duplicate itinerary: ${error.message}`);
        }
    }

    /**
     * Export itinerary to different formats
     * @param {string} itineraryId - Itinerary ID
     * @param {string} format - Export format (json, pdf, ical)
     * @returns {Promise<Object>} Export data
     */
    async exportItinerary(itineraryId, format = 'json') {
        try {
            this.logger.info('Exporting itinerary', { itineraryId, format });
            
            const itinerary = this.itineraries.get(itineraryId);
            if (!itinerary) {
                throw new Error('Itinerary not found');
            }
            
            switch (format.toLowerCase()) {
                case 'json':
                    return this.exportToJSON(itinerary);
                case 'pdf':
                    return this.exportToPDF(itinerary);
                case 'ical':
                    return this.exportToICal(itinerary);
                default:
                    throw new Error(`Unsupported export format: ${format}`);
            }
            
        } catch (error) {
            this.logger.error('Failed to export itinerary', { error: error.message, itineraryId, format });
            throw new Error(`Failed to export itinerary: ${error.message}`);
        }
    }

    /**
     * Validate itinerary data
     * @private
     */
    validateItineraryData(data) {
        const required = ['title', 'destination', 'startDate', 'endDate'];
        const missing = required.filter(field => !data[field] || data[field].toString().trim() === '');
        
        if (missing.length > 0) {
            throw new Error(`Missing required fields: ${missing.join(', ')}`);
        }
        
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new Error('Invalid date format');
        }
        
        if (endDate < startDate) {
            throw new Error('End date must be after start date');
        }
        
        if (data.type && !this.templates[data.type]) {
            throw new Error(`Invalid trip type: ${data.type}`);
        }
    }

    /**
     * Generate day structure for itinerary
     * @private
     */
    generateDayStructure(duration, startDate, template) {
        const days = [];
        
        for (let i = 0; i < duration; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            
            const day = {
                date: currentDate.toISOString().split('T')[0],
                dayNumber: i + 1,
                dayOfWeek: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
                timeSlots: {}
            };
            
            // Create time slots based on template
            for (const slot of template.timeSlots) {
                day.timeSlots[slot] = {
                    name: slot.charAt(0).toUpperCase() + slot.slice(1),
                    items: []
                };
            }
            
            days.push(day);
        }
        
        return days;
    }

    /**
     * Export to JSON format
     * @private
     */
    exportToJSON(itinerary) {
        return {
            format: 'json',
            data: itinerary,
            exportedAt: new Date().toISOString(),
            filename: `${itinerary.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_itinerary.json`
        };
    }

    /**
     * Export to PDF format (mock implementation)
     * @private
     */
    exportToPDF(itinerary) {
        // In a real implementation, you would use a PDF library like jsPDF
        return {
            format: 'pdf',
            data: `PDF export for ${itinerary.title} - ${itinerary.destination}`,
            exportedAt: new Date().toISOString(),
            filename: `${itinerary.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_itinerary.pdf`
        };
    }

    /**
     * Export to iCal format (mock implementation)
     * @private
     */
    exportToICal(itinerary) {
        // In a real implementation, you would generate proper iCal format
        let icalData = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:Travel Planner\n';
        
        for (const day of itinerary.days) {
            for (const timeSlot of Object.values(day.timeSlots)) {
                for (const item of timeSlot.items) {
                    icalData += `BEGIN:VEVENT\n`;
                    icalData += `SUMMARY:${item.title}\n`;
                    icalData += `DTSTART:${day.date.replace(/-/g, '')}T120000Z\n`;
                    icalData += `DTEND:${day.date.replace(/-/g, '')}T130000Z\n`;
                    icalData += `DESCRIPTION:${item.description || ''}\n`;
                    icalData += `END:VEVENT\n`;
                }
            }
        }
        
        icalData += 'END:VCALENDAR';
        
        return {
            format: 'ical',
            data: icalData,
            exportedAt: new Date().toISOString(),
            filename: `${itinerary.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_itinerary.ics`
        };
    }

    /**
     * Load itineraries from storage
     * @private
     */
    async loadItineraries() {
        try {
            const stored = await this.storageManager.getItem('itineraries');
            if (stored && Array.isArray(stored)) {
                for (const itinerary of stored) {
                    this.itineraries.set(itinerary.id, itinerary);
                }
                this.logger.info('Itineraries loaded from storage', { count: stored.length });
            }
        } catch (error) {
            this.logger.error('Failed to load itineraries from storage', { error: error.message });
        }
    }

    /**
     * Save itineraries to storage
     * @private
     */
    async saveItineraries() {
        try {
            const itinerariesArray = Array.from(this.itineraries.values());
            await this.storageManager.setItem('itineraries', itinerariesArray);
            this.logger.debug('Itineraries saved to storage', { count: itinerariesArray.length });
        } catch (error) {
            this.logger.error('Failed to save itineraries to storage', { error: error.message });
        }
    }

    /**
     * Set current active itinerary
     * @param {string} itineraryId - Itinerary ID
     */
    setCurrentItinerary(itineraryId) {
        const itinerary = this.itineraries.get(itineraryId);
        if (itinerary) {
            this.currentItinerary = itinerary;
            this.logger.info('Current itinerary set', { itineraryId, title: itinerary.title });
        } else {
            this.logger.warn('Cannot set current itinerary - not found', { itineraryId });
        }
    }

    /**
     * Get current active itinerary
     * @returns {Object|null} Current itinerary
     */
    getCurrentItinerary() {
        return this.currentItinerary;
    }
} 