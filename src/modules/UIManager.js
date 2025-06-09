/**
 * UI Manager Module
 * Handles loading states, notifications, modals, and UI interactions
 */
import { Logger } from '../utils/Logger.js';

export class UIManager {
    constructor() {
        this.logger = new Logger('UIManager');
        this.toastContainer = null;
        this.loadingSpinner = null;
        this.activeModals = new Set();
        
        this.init();
    }

    /**
     * Initialize UI Manager
     */
    init() {
        this.toastContainer = document.getElementById('toast-container');
        this.loadingSpinner = document.getElementById('loading-spinner');
        
        if (!this.toastContainer) {
            this.logger.warn('Toast container not found');
        }
        
        if (!this.loadingSpinner) {
            this.logger.warn('Loading spinner not found');
        }
        
        this.logger.info('UIManager initialized');
    }

    /**
     * Show loading spinner
     */
    static showLoading() {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            spinner.classList.add('active');
        }
    }

    /**
     * Hide loading spinner
     */
    static hideLoading() {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            spinner.classList.remove('active');
        }
    }

    /**
     * Show toast notification
     */
    static showToast(message, type = 'info', duration = 5000) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${UIManager.getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(toast);

        // Auto remove after duration
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, duration);

        // Add click to dismiss
        toast.addEventListener('click', () => {
            toast.remove();
        });
    }

    /**
     * Get appropriate icon for toast type
     */
    static getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || icons.info;
    }

    /**
     * Show modal
     */
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            this.logger.warn(`Modal not found: ${modalId}`);
            return;
        }

        modal.classList.add('active');
        this.activeModals.add(modalId);
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideModal(modalId);
            }
        });

        // Close on escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.hideModal(modalId);
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);

        this.logger.info(`Modal shown: ${modalId}`);
    }

    /**
     * Hide modal
     */
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.classList.remove('active');
        this.activeModals.delete(modalId);
        
        // Restore body scroll if no modals are active
        if (this.activeModals.size === 0) {
            document.body.style.overflow = '';
        }

        this.logger.info(`Modal hidden: ${modalId}`);
    }

    /**
     * Hide all modals
     */
    hideAllModals() {
        this.activeModals.forEach(modalId => {
            this.hideModal(modalId);
        });
    }

    /**
     * Show confirmation dialog
     */
    showConfirmation(message, onConfirm, onCancel = null) {
        const confirmed = confirm(message);
        if (confirmed && onConfirm) {
            onConfirm();
        } else if (!confirmed && onCancel) {
            onCancel();
        }
        return confirmed;
    }

    /**
     * Animate element entrance
     */
    animateIn(element, animationClass = 'fadeInUp') {
        if (!element) return;
        
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        
        requestAnimationFrame(() => {
            element.style.transition = 'all 0.3s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        });
    }

    /**
     * Animate element exit
     */
    animateOut(element, callback = null) {
        if (!element) return;
        
        element.style.transition = 'all 0.3s ease';
        element.style.opacity = '0';
        element.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            if (callback) callback();
        }, 300);
    }

    /**
     * Create loading state for element
     */
    setElementLoading(element, isLoading = true) {
        if (!element) return;

        if (isLoading) {
            element.classList.add('loading');
            element.disabled = true;
            
            // Store original content
            if (!element.dataset.originalContent) {
                element.dataset.originalContent = element.innerHTML;
            }
            
            element.innerHTML = `
                <i class="fas fa-spinner fa-spin"></i>
                Loading...
            `;
        } else {
            element.classList.remove('loading');
            element.disabled = false;
            
            // Restore original content
            if (element.dataset.originalContent) {
                element.innerHTML = element.dataset.originalContent;
                delete element.dataset.originalContent;
            }
        }
    }

    /**
     * Smooth scroll to element
     */
    scrollToElement(element, offset = 0) {
        if (!element) return;

        const elementPosition = element.offsetTop - offset;
        window.scrollTo({
            top: elementPosition,
            behavior: 'smooth'
        });
    }

    /**
     * Debounce function calls
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Throttle function calls
     */
    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Format currency
     */
    formatCurrency(amount, currency = 'USD') {
        try {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currency
            }).format(amount);
        } catch (error) {
            this.logger.warn('Currency formatting failed', error);
            return `${currency} ${amount}`;
        }
    }

    /**
     * Format date
     */
    formatDate(date, options = {}) {
        try {
            const defaultOptions = {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            };
            
            return new Intl.DateTimeFormat('en-US', {
                ...defaultOptions,
                ...options
            }).format(new Date(date));
        } catch (error) {
            this.logger.warn('Date formatting failed', error);
            return date.toString();
        }
    }

    /**
     * Create empty state message
     */
    createEmptyState(container, message, icon = 'fas fa-search', actionButton = null) {
        if (!container) return;

        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <i class="${icon}"></i>
            <h3>No Results Found</h3>
            <p>${message}</p>
            ${actionButton ? `<button class="btn btn-primary">${actionButton}</button>` : ''}
        `;

        container.innerHTML = '';
        container.appendChild(emptyState);
    }

    /**
     * Validate form
     */
    validateForm(form) {
        if (!form) return false;

        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!input.value.trim()) {
                this.showFieldError(input, 'This field is required');
                isValid = false;
            } else {
                this.clearFieldError(input);
            }
        });

        return isValid;
    }

    /**
     * Show field error
     */
    showFieldError(field, message) {
        this.clearFieldError(field);
        
        field.classList.add('error');
        
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        
        field.parentNode.appendChild(errorElement);
    }

    /**
     * Clear field error
     */
    clearFieldError(field) {
        field.classList.remove('error');
        
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }

    /**
     * Cleanup UI Manager
     */
    destroy() {
        this.hideAllModals();
        document.body.style.overflow = '';
        this.logger.info('UIManager destroyed');
    }
} 