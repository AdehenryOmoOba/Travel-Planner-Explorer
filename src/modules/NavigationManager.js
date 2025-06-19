/**
 * Navigation Manager Module
 * Handles SPA routing and navigation between pages
 */
import { Logger } from '../utils/Logger.js';
import { UIManager } from './UIManager.js';

export class NavigationManager {
    constructor() {
        this.logger = new Logger('NavigationManager');
        this.currentPage = 'home';
        this.pages = new Map();
        this.history = [];
        
        this.init();
    }

    /**
     * Initialize Navigation Manager
     */
    init() {
        this.setupPages();
        this.setupEventListeners();
        this.handleInitialRoute();
        
        this.logger.info('NavigationManager initialized');
    }

    /**
     * Setup page configurations
     */
    setupPages() {
        this.pages.set('home', {
            element: document.getElementById('home-page'),
            title: 'Home - Travel Explorer',
            requiresAuth: false,
            onEnter: (params) => this.onHomePageEnter(params),
            onExit: () => this.onHomePageExit()
        });

        this.pages.set('explore', {
            element: document.getElementById('explore-page'),
            title: 'Explore - Travel Explorer',
            requiresAuth: false,
            onEnter: (params) => this.onExplorePageEnter(params),
            onExit: () => this.onExplorePageExit()
        });

        this.pages.set('planner', {
            element: document.getElementById('planner-page'),
            title: 'Trip Planner - Travel Explorer',
            requiresAuth: true,
            onEnter: (params) => this.onPlannerPageEnter(params),
            onExit: () => this.onPlannerPageExit()
        });

        this.pages.set('map', {
            element: document.getElementById('map-page'),
            title: 'Map - Travel Explorer',
            requiresAuth: false,
            onEnter: (params) => this.onMapPageEnter(params),
            onExit: () => this.onMapPageExit()
        });

        this.pages.set('profile', {
            element: document.getElementById('profile-page'),
            title: 'Profile - Travel Explorer',
            requiresAuth: true,
            onEnter: (params) => this.onProfilePageEnter(params),
            onExit: () => this.onProfilePageExit()
        });
    }

    /**
     * Setup navigation event listeners
     */
    setupEventListeners() {
        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                if (page) {
                    this.navigateTo(page);
                }
            });
        });

        // Mobile hamburger menu
        const hamburger = document.getElementById('hamburger');
        const navMenu = document.getElementById('nav-menu');
        
        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');
                navMenu.classList.toggle('active');
            });
        }

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (navMenu && hamburger && 
                !navMenu.contains(e.target) && 
                !hamburger.contains(e.target)) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });

        // Auth buttons
        const loginBtn = document.getElementById('login-btn');
        const registerBtn = document.getElementById('register-btn');

        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                this.showAuthModal('login');
            });
        }

        if (registerBtn) {
            registerBtn.addEventListener('click', () => {
                this.showAuthModal('register');
            });
        }
    }

    /**
     * Handle initial route on page load
     */
    handleInitialRoute() {
        const hash = window.location.hash.slice(1);
        const page = hash || 'home';
        this.navigateTo(page, null, false);
    }

    /**
     * Navigate to a specific page
     */
    navigateTo(page, params = null, addToHistory = true) {
        // Validate page exists
        if (!this.pages.has(page)) {
            this.logger.warn(`Page not found: ${page}`);
            page = 'home';
        }

        const pageConfig = this.pages.get(page);

        // Check authentication requirement
        if (pageConfig.requiresAuth && !this.isAuthenticated()) {
            this.logger.info(`Authentication required for page: ${page}`);
            this.showAuthModal('login');
            return;
        }

        // Exit current page
        if (this.currentPage && this.pages.has(this.currentPage)) {
            const currentPageConfig = this.pages.get(this.currentPage);
            if (currentPageConfig.onExit) {
                currentPageConfig.onExit();
            }
        }

        // Add to history
        if (addToHistory) {
            this.history.push({
                page: this.currentPage,
                timestamp: Date.now()
            });
        }

        // Update current page
        this.currentPage = page;

        // Update URL
        window.location.hash = page;

        // Update page visibility
        this.updatePageVisibility(page);

        // Update navigation state
        this.updateNavigationState(page);

        // Update page title
        document.title = pageConfig.title;

        // Enter new page
        if (pageConfig.onEnter) {
            pageConfig.onEnter(params);
        }

        this.logger.info(`Navigated to page: ${page}`, { params });
    }

    /**
     * Update page visibility
     */
    updatePageVisibility(activePage) {
        this.pages.forEach((config, pageName) => {
            if (config.element) {
                if (pageName === activePage) {
                    config.element.classList.add('active');
                } else {
                    config.element.classList.remove('active');
                }
            }
        });
    }

    /**
     * Update navigation state
     */
    updateNavigationState(activePage) {
        document.querySelectorAll('.nav-link').forEach(link => {
            if (link.dataset.page === activePage) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Close mobile menu
        const hamburger = document.getElementById('hamburger');
        const navMenu = document.getElementById('nav-menu');
        
        if (hamburger && navMenu) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        }
    }

    /**
     * Handle route changes (back/forward buttons)
     */
    handleRouteChange() {
        const hash = window.location.hash.slice(1);
        const page = hash || 'home';
        
        if (page !== this.currentPage) {
            this.navigateTo(page, null, false);
        }
    }

    /**
     * Go back to previous page
     */
    goBack() {
        if (this.history.length > 0) {
            const previousPage = this.history.pop();
            this.navigateTo(previousPage.page, null, false);
        } else {
            this.navigateTo('home', null, false);
        }
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        // This will be implemented by AuthenticationManager
        return window.TravelApp?.modules?.auth?.isAuthenticated() || false;
    }

    /**
     * Show authentication modal
     */
    showAuthModal(mode = 'login') {
        const modal = document.getElementById('auth-modal');
        const modalTitle = document.getElementById('modal-title');
        const authBtnText = document.getElementById('auth-btn-text');
        const confirmPasswordGroup = document.getElementById('confirm-password-group');
        const tabBtns = document.querySelectorAll('.tab-btn');

        if (!modal) return;

        // Update modal for login/register
        if (mode === 'login') {
            modalTitle.textContent = 'Login';
            authBtnText.textContent = 'Login';
            confirmPasswordGroup.style.display = 'none';
            
            tabBtns.forEach(btn => {
                if (btn.dataset.tab === 'login') {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        } else {
            modalTitle.textContent = 'Register';
            authBtnText.textContent = 'Register';
            confirmPasswordGroup.style.display = 'block';
            
            tabBtns.forEach(btn => {
                if (btn.dataset.tab === 'register') {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        }

        // Show modal
        if (window.TravelApp?.modules?.ui) {
            window.TravelApp.modules.ui.showModal('auth-modal');
        }

        // Setup tab switching
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.showAuthModal(tab);
            });
        });

        // Setup modal close
        const modalClose = document.getElementById('modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                if (window.TravelApp?.modules?.ui) {
                    window.TravelApp.modules.ui.hideModal('auth-modal');
                }
            });
        }
    }

    /**
     * Initialize current page
     */
    initializePage() {
        const pageConfig = this.pages.get(this.currentPage);
        if (pageConfig && pageConfig.onEnter) {
            pageConfig.onEnter();
        }
    }

    // Page-specific enter/exit handlers
    onHomePageEnter(params) {
        this.logger.debug('Entering home page');
        // Load popular destinations if not already loaded
        if (window.TravelApp?.modules?.api) {
            // This will be handled by the main app
        }
    }

    onHomePageExit() {
        this.logger.debug('Exiting home page');
    }

    onExplorePageEnter(params) {
        this.logger.debug('Entering explore page', params);
        
        // Initialize explore page functionality
        if (window.TravelApp?.services) {
            // Load explore data
            this.loadExploreData(params);
        } else {
            this.logger.warn('TravelApp services not available');
        }
    }

    onExplorePageExit() {
        this.logger.debug('Exiting explore page');
    }

    onPlannerPageEnter(params) {
        this.logger.debug('Entering planner page');
        
        // Load user trips
        if (window.TravelApp?.modules?.tripPlanner) {
            window.TravelApp.modules.tripPlanner.loadUserTrips();
        }
    }

    onPlannerPageExit() {
        this.logger.debug('Exiting planner page');
    }

    onMapPageEnter(params) {
        this.logger.debug('Entering map page');
        
        // Initialize map
        if (window.TravelApp?.services?.map) {
            // Use a timeout to ensure the map container is rendered
            setTimeout(() => {
                window.TravelApp.initializeMap();
            }, 100);
        }
    }

    onMapPageExit() {
        this.logger.debug('Exiting map page');
    }

    onProfilePageEnter(params) {
        this.logger.debug('Entering profile page');
        
        // Load user profile data
        if (window.TravelApp?.modules?.auth) {
            this.loadProfileData();
        }
    }

    onProfilePageExit() {
        this.logger.debug('Exiting profile page');
    }

    /**
     * Load explore data based on parameters
     */
    async loadExploreData(params) {
        try {
            const exploreResults = document.getElementById('explore-results');
            if (!exploreResults) {
                this.logger.warn('explore-results container not found');
                return;
            }

            this.logger.debug('Loading explore data', { params, hasLocation: !!params?.location });
            UIManager.showLoading();

            // If specific location details provided (from Explore button)
            if (params?.location) {
                this.logger.info('Rendering location details', { locationName: params.location.name });
                
                // Render city/country and interesting info
                const location = params.location;
                let detailsHtml = `
                    <div class="explore-location-details" style="margin-bottom: var(--spacing-xl); padding: var(--spacing-lg); background: var(--accent-cream); border-radius: var(--radius-lg); box-shadow: var(--shadow-light);">
                        <h2 style="margin-bottom: var(--spacing-sm);">${location.name || 'Unknown Location'}</h2>
                        <h4 style="margin-bottom: var(--spacing-sm); color: var(--primary-color);">${location.country || ''}</h4>
                        <p style="margin-bottom: var(--spacing-md);">${location.description || 'No description available'}</p>
                        ${location.facts && location.facts.length > 0 ? `
                        <div style="margin-bottom: var(--spacing-md);">
                            <strong>Interesting Facts:</strong>
                            <ul>
                                ${location.facts.map(fact => `<li>${fact}</li>`).join('')}
                            </ul>
                        </div>
                        ` : ''}
                        ${location.transportation ? `
                        <div style="margin-bottom: var(--spacing-md);">
                            <strong>Transportation:</strong> ${Object.values(location.transportation).join(', ')}
                        </div>
                        ` : ''}
                        ${location.safety ? `
                        <div style="margin-bottom: var(--spacing-md);">
                            <strong>Safety:</strong> ${location.safety.overall || 'Information not available'}
                            ${location.safety.tips && location.safety.tips.length > 0 ? `
                            <ul>
                                ${location.safety.tips.map(tip => `<li>${tip}</li>`).join('')}
                            </ul>
                            ` : ''}
                        </div>
                        ` : ''}
                    </div>
                `;
                exploreResults.innerHTML = detailsHtml;
                this.logger.info('Location details rendered successfully');
                return;
            }

            // If specific destination requested
            if (params?.destination) {
                this.logger.info('Searching for destination', { destination: params.destination });
                const destinations = await window.TravelApp.services.location.searchLocations({ query: params.destination });
                this.renderExploreResults(destinations);
            } else {
                // Load default explore data
                this.logger.info('Loading default popular destinations');
                const destinations = await window.TravelApp.services.location.searchLocations({ query: 'popular destinations' });
                this.renderExploreResults(destinations);
            }

        } catch (error) {
            this.logger.error('Failed to load explore data', error);
            UIManager.showToast('Failed to load destinations', 'error');
            
            // Show error state in the container
            const exploreResults = document.getElementById('explore-results');
            if (exploreResults) {
                exploreResults.innerHTML = `
                    <div class="error-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Failed to load content</h3>
                        <p>Please try again or go back to search for destinations.</p>
                    </div>
                `;
            }
        } finally {
            UIManager.hideLoading();
        }
    }

    /**
     * Render explore results
     */
    renderExploreResults(destinations) {
        const container = document.getElementById('explore-results');
        if (!container) return;

        if (!destinations || destinations.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>No destinations found</h3>
                    <p>Try adjusting your search criteria</p>
                </div>
            `;
            return;
        }

        container.innerHTML = destinations.map(destination => `
            <div class="destination-card">
                <img src="${destination.image}" alt="${destination.name}" loading="lazy">
                <div class="destination-card-content">
                    <h3>${destination.name}</h3>
                    <p>${destination.description}</p>
                    <div class="destination-card-footer">
                        <div class="destination-rating">
                            <i class="fas fa-star"></i>
                            <span>${destination.rating}</span>
                        </div>
                        <button class="btn btn-primary btn-sm">
                            Add to Trip
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Load profile data
     */
    loadProfileData() {
        const userData = window.TravelApp.modules.storage.getUserData();
        if (userData) {
            // Update profile display
            const nameElement = document.getElementById('profile-name');
            const emailElement = document.getElementById('profile-email');
            
            if (nameElement) nameElement.textContent = userData.name || 'User';
            if (emailElement) emailElement.textContent = userData.email || '';
        }
    }

    /**
     * Get current page
     */
    getCurrentPage() {
        return this.currentPage;
    }

    /**
     * Get navigation history
     */
    getHistory() {
        return [...this.history];
    }

    /**
     * Cleanup Navigation Manager
     */
    destroy() {
        // Remove event listeners would go here
        this.logger.info('NavigationManager destroyed');
    }
} 