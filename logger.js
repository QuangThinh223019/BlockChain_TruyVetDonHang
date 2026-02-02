/**
 * Logging Service
 * Structured logging for the application
 */

const fs = require('fs');
const path = require('path');
const config = require('./config');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, 'logs');
    this.ensureLogDir();
    
    // Log levels
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      http: 3,
      debug: 4
    };
    
    this.currentLevel = this.levels[config.loggingConfig.level] || this.levels.info;
  }

  /**
   * Ensure log directory exists
   */
  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Format log message
   */
  formatLog(level, message, meta = {}) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      ...this._sanitizeMeta(meta)
    });
  }

  /**
   * Sanitize sensitive fields from metadata
   */
  _sanitizeMeta(meta) {
    const sanitized = { ...meta };
    const excludeFields = config.loggingConfig.excludeFields;
    
    for (const field of excludeFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  /**
   * Write log to console
   */
  _logToConsole(level, message, meta) {
    const levelNum = this.levels[level];
    
    if (levelNum <= this.currentLevel) {
      const colors = {
        error: '\x1b[31m', // Red
        warn: '\x1b[33m',  // Yellow
        info: '\x1b[36m',  // Cyan
        http: '\x1b[35m',  // Magenta
        debug: '\x1b[90m'  // Gray
      };
      
      const reset = '\x1b[0m';
      const color = colors[level] || '';
      
      console.log(`${color}[${level.toUpperCase()}] ${message}${reset}`, meta);
    }
  }

  /**
   * Write log to file
   */
  _logToFile(level, message, meta) {
    if (!config.loggingConfig.files.enabled) {
      return;
    }

    const logFile = path.join(
      this.logDir,
      `${level}-${new Date().toISOString().split('T')[0]}.log`
    );

    const logMessage = this.formatLog(level, message, meta);
    
    fs.appendFileSync(logFile, logMessage + '\n', 'utf-8');
  }

  /**
   * Log error
   */
  error(message, meta = {}) {
    this._logToConsole('error', message, meta);
    this._logToFile('error', message, meta);
  }

  /**
   * Log warning
   */
  warn(message, meta = {}) {
    this._logToConsole('warn', message, meta);
    this._logToFile('warn', message, meta);
  }

  /**
   * Log info
   */
  info(message, meta = {}) {
    this._logToConsole('info', message, meta);
    this._logToFile('info', message, meta);
  }

  /**
   * Log HTTP request
   */
  http(message, meta = {}) {
    this._logToConsole('http', message, meta);
    this._logToFile('http', message, meta);
  }

  /**
   * Log debug
   */
  debug(message, meta = {}) {
    this._logToConsole('debug', message, meta);
    this._logToFile('debug', message, meta);
  }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger;
