/**
 * Authentication Manager Module
 * Handles user authentication, login, and registration
 */
import { Logger } from '../utils/Logger.js';
import { UIManager } from './UIManager.js';

export class AuthenticationManager {
    constructor(storageManager) {
        this.logger = new Logger('AuthenticationManager');
        this.storage = storageManager;
        this.currentUser = null;
        this.isLoggedIn = false;
        
        this.init();
    }

    /**
     * Initialize Authentication Manager
     */
    init() {
        this.loadUserSession();
        this.setupEventListeners();
        
        this.logger.info('AuthenticationManager initialized', { 
            isLoggedIn: this.isLoggedIn 
        });
    }

    /**
     * Load user session from storage
     */
    loadUserSession() {
        const userData = this.storage.getUserData();
        if (userData && userData.sessionToken) {
            this.currentUser = userData;
            this.isLoggedIn = true;
            this.updateAuthUI();
        }
    }

    /**
     * Setup authentication event listeners
     */
    setupEventListeners() {
        const authForm = document.getElementById('auth-form');
        if (authForm) {
            authForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAuthSubmit(e);
            });
        }
    }

    /**
     * Handle authentication form submission
     */
    async handleAuthSubmit(event) {
        const form = event.target;
        const formData = new FormData(form);
        const email = formData.get('email');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirm-password');
        
        // Determine if this is login or register
        const isRegister = document.getElementById('confirm-password-group').style.display !== 'none';
        
        try {
            if (isRegister) {
                await this.register(email, password, confirmPassword);
            } else {
                await this.login(email, password);
            }
        } catch (error) {
            this.logger.error('Authentication failed', error);
            UIManager.showToast(error.message, 'error');
        }
    }

    /**
     * Login user
     */
    async login(email, password) {
        this.logger.info('Attempting login', { email });
        
        // Validate input
        if (!email || !password) {
            throw new Error('Email and password are required');
        }

        if (!this.isValidEmail(email)) {
            throw new Error('Please enter a valid email address');
        }

        // Simulate API call (replace with real API)
        const userData = await this.simulateLogin(email, password);
        
        // Store user data
        this.currentUser = userData;
        this.isLoggedIn = true;
        this.storage.setUserData(userData);
        
        // Update UI
        this.updateAuthUI();
        
        // Close modal
        if (window.TravelApp?.modules?.ui) {
            window.TravelApp.modules.ui.hideModal('auth-modal');
        }
        
        // Show success message
        UIManager.showToast(`Welcome back, ${userData.name}!`, 'success');
        
        this.logger.info('Login successful', { userId: userData.id });
    }

    /**
     * Register new user
     */
    async register(email, password, confirmPassword) {
        this.logger.info('Attempting registration', { email });
        
        // Validate input
        if (!email || !password || !confirmPassword) {
            throw new Error('All fields are required');
        }

        if (!this.isValidEmail(email)) {
            throw new Error('Please enter a valid email address');
        }

        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters long');
        }

        if (password !== confirmPassword) {
            throw new Error('Passwords do not match');
        }

        // Simulate API call (replace with real API)
        const userData = await this.simulateRegister(email, password);
        
        // Store user data
        this.currentUser = userData;
        this.isLoggedIn = true;
        this.storage.setUserData(userData);
        
        // Update UI
        this.updateAuthUI();
        
        // Close modal
        if (window.TravelApp?.modules?.ui) {
            window.TravelApp.modules.ui.hideModal('auth-modal');
        }
        
        // Show success message
        UIManager.showToast(`Welcome to Travel Explorer, ${userData.name}!`, 'success');
        
        this.logger.info('Registration successful', { userId: userData.id });
    }

    /**
     * Logout user
     */
    logout() {
        this.logger.info('Logging out user', { userId: this.currentUser?.id });
        
        // Clear user data
        this.currentUser = null;
        this.isLoggedIn = false;
        this.storage.removeItem('user');
        
        // Update UI
        this.updateAuthUI();
        
        // Navigate to home
        if (window.TravelApp?.modules?.navigation) {
            window.TravelApp.modules.navigation.navigateTo('home');
        }
        
        // Show message
        UIManager.showToast('You have been logged out', 'info');
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.isLoggedIn && this.currentUser !== null;
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Update authentication UI
     */
    updateAuthUI() {
        const loginBtn = document.getElementById('login-btn');
        const registerBtn = document.getElementById('register-btn');
        const navAuth = document.querySelector('.nav-auth');
        
        if (!navAuth) return;

        if (this.isLoggedIn && this.currentUser) {
            // Show user menu
            navAuth.innerHTML = `
                <div class="user-menu">
                    <span class="user-name">Hi, ${this.currentUser.name}</span>
                    <button class="btn btn-outline" onclick="window.TravelApp.modules.auth.logout()">
                        Logout
                    </button>
                </div>
            `;
        } else {
            // Show login/register buttons
            navAuth.innerHTML = `
                <button class="btn btn-outline" id="login-btn">Login</button>
                <button class="btn btn-primary" id="register-btn">Register</button>
            `;
            
            // Re-attach event listeners
            const newLoginBtn = document.getElementById('login-btn');
            const newRegisterBtn = document.getElementById('register-btn');
            
            if (newLoginBtn) {
                newLoginBtn.addEventListener('click', () => {
                    window.TravelApp.modules.navigation.showAuthModal('login');
                });
            }
            
            if (newRegisterBtn) {
                newRegisterBtn.addEventListener('click', () => {
                    window.TravelApp.modules.navigation.showAuthModal('register');
                });
            }
        }
    }

    /**
     * Validate email format
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Simulate login API call
     */
    async simulateLogin(email, password) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if user exists in storage (for demo purposes)
        const existingUsers = this.storage.getItem('registered_users') || [];
        const user = existingUsers.find(u => u.email === email);
        
        if (!user) {
            throw new Error('User not found. Please register first.');
        }
        
        if (user.password !== password) {
            throw new Error('Invalid password');
        }
        
        // Return user data with session token
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            sessionToken: this.generateSessionToken(),
            loginTime: new Date().toISOString()
        };
    }

    /**
     * Simulate register API call
     */
    async simulateRegister(email, password) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if user already exists
        const existingUsers = this.storage.getItem('registered_users') || [];
        const existingUser = existingUsers.find(u => u.email === email);
        
        if (existingUser) {
            throw new Error('User already exists. Please login instead.');
        }
        
        // Create new user
        const newUser = {
            id: this.generateUserId(),
            name: email.split('@')[0], // Use email prefix as name
            email: email,
            password: password, // In real app, this would be hashed
            registrationDate: new Date().toISOString()
        };
        
        // Store user in registered users list
        existingUsers.push(newUser);
        this.storage.setItem('registered_users', existingUsers);
        
        // Return user data with session token
        return {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            sessionToken: this.generateSessionToken(),
            loginTime: new Date().toISOString()
        };
    }

    /**
     * Generate session token
     */
    generateSessionToken() {
        return `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Generate user ID
     */
    generateUserId() {
        return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Cleanup Authentication Manager
     */
    destroy() {
        this.currentUser = null;
        this.isLoggedIn = false;
        this.logger.info('AuthenticationManager destroyed');
    }
} 