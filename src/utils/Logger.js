/**
 * Logger Utility Class
 * Provides structured logging with timestamps and context
 */
export class Logger {
    constructor(context = 'App') {
        this.context = context;
        this.logLevel = this.getLogLevel();
        this.sessionId = this.generateSessionId();
    }

    /**
     * Get log level from environment or default to 'info'
     */
    getLogLevel() {
        const level = localStorage.getItem('logLevel') || 'info';
        const levels = ['error', 'warn', 'info', 'debug'];
        return levels.includes(level) ? level : 'info';
    }

    /**
     * Generate unique session ID for tracking
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Check if log level should be output
     */
    shouldLog(level) {
        const levels = { error: 0, warn: 1, info: 2, debug: 3 };
        return levels[level] <= levels[this.logLevel];
    }

    /**
     * Format log message with timestamp and context
     */
    formatMessage(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level: level.toUpperCase(),
            context: this.context,
            sessionId: this.sessionId,
            message,
            ...(data && { data })
        };

        return {
            formatted: `[${timestamp}] ${level.toUpperCase()} [${this.context}] ${message}`,
            structured: logEntry
        };
    }

    /**
     * Log error messages
     */
    error(message, error = null) {
        if (!this.shouldLog('error')) return;

        const { formatted, structured } = this.formatMessage('error', message, {
            error: error ? {
                name: error.name,
                message: error.message,
                stack: error.stack
            } : null
        });

        console.error(formatted, error || '');
        this.saveToStorage('error', structured);
    }

    /**
     * Log warning messages
     */
    warn(message, data = null) {
        if (!this.shouldLog('warn')) return;

        const { formatted, structured } = this.formatMessage('warn', message, data);
        console.warn(formatted, data || '');
        this.saveToStorage('warn', structured);
    }

    /**
     * Log info messages
     */
    info(message, data = null) {
        if (!this.shouldLog('info')) return;

        const { formatted, structured } = this.formatMessage('info', message, data);
        console.info(formatted, data || '');
        this.saveToStorage('info', structured);
    }

    /**
     * Log debug messages
     */
    debug(message, data = null) {
        if (!this.shouldLog('debug')) return;

        const { formatted, structured } = this.formatMessage('debug', message, data);
        console.debug(formatted, data || '');
        this.saveToStorage('debug', structured);
    }

    /**
     * Save logs to localStorage for debugging
     */
    saveToStorage(level, logEntry) {
        try {
            const logs = JSON.parse(localStorage.getItem('travelapp_logs') || '[]');
            logs.push(logEntry);
            
            // Keep only last 100 logs to prevent storage overflow
            if (logs.length > 100) {
                logs.splice(0, logs.length - 100);
            }
            
            localStorage.setItem('travelapp_logs', JSON.stringify(logs));
        } catch (error) {
            console.warn('Failed to save log to storage:', error);
        }
    }

    /**
     * Get all stored logs
     */
    getLogs() {
        try {
            return JSON.parse(localStorage.getItem('travelapp_logs') || '[]');
        } catch (error) {
            console.warn('Failed to retrieve logs from storage:', error);
            return [];
        }
    }

    /**
     * Clear all stored logs
     */
    clearLogs() {
        try {
            localStorage.removeItem('travelapp_logs');
            this.info('Logs cleared');
        } catch (error) {
            console.warn('Failed to clear logs:', error);
        }
    }

    /**
     * Set log level
     */
    setLogLevel(level) {
        const levels = ['error', 'warn', 'info', 'debug'];
        if (levels.includes(level)) {
            this.logLevel = level;
            localStorage.setItem('logLevel', level);
            this.info(`Log level set to: ${level}`);
        } else {
            this.warn(`Invalid log level: ${level}. Valid levels: ${levels.join(', ')}`);
        }
    }

    /**
     * Create child logger with additional context
     */
    child(additionalContext) {
        const childLogger = new Logger(`${this.context}:${additionalContext}`);
        childLogger.sessionId = this.sessionId;
        return childLogger;
    }
} 