/**
 * Caching Service
 * In-memory caching layer for blockchain and API data
 */

class CacheService {
  constructor(config = {}) {
    this.cache = new Map();
    this.timers = new Map();
    
    this.config = {
      maxKeys: config.maxKeys || 1000,
      maxMemoryMB: config.maxMemoryMB || 100,
      ...config
    };
  }

  /**
   * Set value in cache with TTL
   */
  set(key, value, ttl = 30) {
    // Check cache size
    if (this.cache.size >= this.config.maxKeys) {
      this._evictOldest();
    }

    // Clear existing timer
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Set value
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });

    // Set expiration timer
    const timer = setTimeout(() => {
      this.delete(key);
    }, ttl * 1000);

    this.timers.set(key, timer);
  }

  /**
   * Get value from cache
   */
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if expired
    const age = (Date.now() - item.timestamp) / 1000;
    if (age > item.ttl) {
      this.delete(key);
      return null;
    }

    return item.value;
  }

  /**
   * Check if key exists
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Delete from cache
   */
  delete(key) {
    this.cache.delete(key);
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.forEach((_, key) => {
      this.delete(key);
    });
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Evict oldest entry
   */
  _evictOldest() {
    let oldestKey = null;
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
    }
  }
}

module.exports = CacheService;
