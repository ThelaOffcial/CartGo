/**
 * CartGo - Utility Functions
 * Common helper functions used across the application
 */

/**
 * DOM Manipulation Utilities
 */

export const DOM = {
  // Get element by ID
  id: (id) => document.getElementById(id),
  
  // Get elements by class
  class: (className) => document.querySelectorAll(`.${className}`),
  
  // Get element by selector
  select: (selector) => document.querySelector(selector),
  
  // Get all elements by selector
  selectAll: (selector) => document.querySelectorAll(selector),
  
  // Add class
  addClass: (element, className) => {
    if (element) element.classList.add(className);
  },
  
  // Remove class
  removeClass: (element, className) => {
    if (element) element.classList.remove(className);
  },
  
  // Toggle class
  toggleClass: (element, className) => {
    if (element) element.classList.toggle(className);
  },
  
  // Check if element has class
  hasClass: (element, className) => {
    return element ? element.classList.contains(className) : false;
  },
  
  // Set element text
  setText: (element, text) => {
    if (element) element.textContent = text;
  },
  
  // Get element text
  getText: (element) => {
    return element ? element.textContent : '';
  },
  
  // Set element HTML
  setHTML: (element, html) => {
    if (element) element.innerHTML = html;
  },
  
  // Get element HTML
  getHTML: (element) => {
    return element ? element.innerHTML : '';
  },
  
  // Set element attribute
  setAttribute: (element, name, value) => {
    if (element) element.setAttribute(name, value);
  },
  
  // Get element attribute
  getAttribute: (element, name) => {
    return element ? element.getAttribute(name) : null;
  },
  
  // Show element
  show: (element) => {
    if (element) element.style.display = 'block';
  },
  
  // Hide element
  hide: (element) => {
    if (element) element.style.display = 'none';
  },
  
  // Toggle visibility
  toggle: (element) => {
    if (element) {
      element.style.display = element.style.display === 'none' ? 'block' : 'none';
    }
  },
  
  // Set element value
  setValue: (element, value) => {
    if (element) element.value = value;
  },
  
  // Get element value
  getValue: (element) => {
    return element ? element.value : '';
  }
};

/**
 * Validation Utilities
 */

export const Validator = {
  // Validate email
  email: (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },
  
  // Validate password (min 6 chars)
  password: (password) => {
    return password.length >= 6;
  },
  
  // Validate phone number
  phone: (phone) => {
    const re = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
    return re.test(phone);
  },
  
  // Validate URL
  url: (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
  
  // Validate number
  number: (num) => {
    return !isNaN(num) && num !== '';
  },
  
  // Validate required field
  required: (value) => {
    return value && value.trim().length > 0;
  },
  
  // Validate min length
  minLength: (value, min) => {
    return value.length >= min;
  },
  
  // Validate max length
  maxLength: (value, max) => {
    return value.length <= max;
  },
  
  // Validate price format
  price: (price) => {
    return /^\d+(\.\d{1,2})?$/.test(price);
  }
};

/**
 * String Utilities
 */

export const String = {
  // Capitalize first letter
  capitalize: (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },
  
  // Make string lowercase
  lowercase: (str) => str.toLowerCase(),
  
  // Make string uppercase
  uppercase: (str) => str.toUpperCase(),
  
  // Truncate string
  truncate: (str, length) => {
    return str.length > length ? str.substring(0, length) + '...' : str;
  },
  
  // Remove extra spaces
  trim: (str) => str.trim(),
  
  // Generate random ID
  generateId: () => {
    return Math.random().toString(36).substr(2, 9);
  },
  
  // Generate slug from string
  generateSlug: (str) => {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },
  
  // Sanitize HTML
  sanitizeHTML: (str) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};

/**
 * Number Utilities
 */

export const Number = {
  // Format number with commas
  formatCommas: (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },
  
  // Format currency
  formatCurrency: (num, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(num);
  },
  
  // Round to decimal places
  round: (num, decimals = 2) => {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  },
  
  // Format percentage
  formatPercent: (num) => {
    return Math.round(num) + '%';
  },
  
  // Calculate discount
  calculateDiscount: (originalPrice, discountPercent) => {
    return Number.round(originalPrice * (1 - discountPercent / 100));
  },
  
  // Calculate tax
  calculateTax: (price, taxPercent) => {
    return Number.round(price * (taxPercent / 100));
  }
};

/**
 * Date Utilities
 */

export const Date = {
  // Format date
  format: (date, format = 'DD/MM/YYYY') => {
    const d = new window.Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    return format
      .replace('DD', day)
      .replace('MM', month)
      .replace('YYYY', year);
  },
  
  // Get days ago
  daysAgo: (date) => {
    const now = new window.Date();
    const then = new window.Date(date);
    const diff = now - then;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  },
  
  // Get time ago
  timeAgo: (date) => {
    const now = new window.Date();
    const then = new window.Date(date);
    const diff = now - then;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return Date.format(date);
  },
  
  // Get current date
  today: () => {
    return new window.Date().toISOString().split('T')[0];
  },
  
  // Add days
  addDays: (date, days) => {
    const d = new window.Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }
};

/**
 * Storage Utilities
 */

export const Storage = {
  // Set item
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage set error:', e);
    }
  },
  
  // Get item
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error('Storage get error:', e);
      return null;
    }
  },
  
  // Remove item
  remove: (key) => {
    localStorage.removeItem(key);
  },
  
  // Clear all
  clear: () => {
    localStorage.clear();
  },
  
  // Check if key exists
  has: (key) => {
    return localStorage.getItem(key) !== null;
  }
};

/**
 * Array Utilities
 */

export const Array = {
  // Unique values
  unique: (arr) => {
    return [...new Set(arr)];
  },
  
  // Group by key
  groupBy: (arr, key) => {
    return arr.reduce((result, item) => {
      if (!result[item[key]]) {
        result[item[key]] = [];
      }
      result[item[key]].push(item);
      return result;
    }, {});
  },
  
  // Sort ascending
  sortAsc: (arr, key) => {
    return [...arr].sort((a, b) => a[key] - b[key]);
  },
  
  // Sort descending
  sortDesc: (arr, key) => {
    return [...arr].sort((a, b) => b[key] - a[key]);
  },
  
  // Filter by key value
  filterBy: (arr, key, value) => {
    return arr.filter(item => item[key] === value);
  },
  
  // Find item by key
  findBy: (arr, key, value) => {
    return arr.find(item => item[key] === value);
  },
  
  // Paginate array
  paginate: (arr, page, pageSize) => {
    const start = (page - 1) * pageSize;
    return arr.slice(start, start + pageSize);
  },
  
  // Sum values
  sum: (arr, key) => {
    return arr.reduce((sum, item) => sum + item[key], 0);
  },
  
  // Average values
  average: (arr, key) => {
    return Array.sum(arr, key) / arr.length;
  }
};

/**
 * Notification Utilities
 */

export const Alert = {
  // Success alert
  success: (title, message = '') => {
    Swal.fire({
      icon: 'success',
      title: title,
      text: message,
      confirmButtonColor: '#10b981',
      timer: 2000,
      showConfirmButton: false
    });
  },
  
  // Error alert
  error: (title, message = '') => {
    Swal.fire({
      icon: 'error',
      title: title,
      text: message,
      confirmButtonColor: '#ef4444'
    });
  },
  
  // Warning alert
  warning: (title, message = '') => {
    Swal.fire({
      icon: 'warning',
      title: title,
      text: message,
      confirmButtonColor: '#f59e0b'
    });
  },
  
  // Info alert
  info: (title, message = '') => {
    Swal.fire({
      icon: 'info',
      title: title,
      text: message,
      confirmButtonColor: '#3b82f6'
    });
  },
  
  // Confirm dialog
  confirm: (title, message = '') => {
    return Swal.fire({
      icon: 'question',
      title: title,
      text: message,
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Yes',
      cancelButtonText: 'No'
    });
  },
  
  // Loading
  loading: (title = 'Loading...') => {
    Swal.fire({
      title: title,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  },
  
  // Close alert
  close: () => {
    Swal.close();
  }
};

/**
 * API Utilities
 */

export const API = {
  // Fetch data
  fetch: async (url, options = {}) => {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return null;
    }
  },
  
  // POST request
  post: async (url, data = {}) => {
    return API.fetch(url, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  // PUT request
  put: async (url, data = {}) => {
    return API.fetch(url, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  
  // DELETE request
  delete: async (url) => {
    return API.fetch(url, {
      method: 'DELETE'
    });
  }
};

/**
 * Debounce Function
 */

export const debounce = (func, delay) => {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

/**
 * Throttle Function
 */

export const throttle = (func, delay) => {
  let lastCall = 0;
  return function (...args) {
    const now = new window.Date().getTime();
    if (now - lastCall >= delay) {
      func.apply(this, args);
      lastCall = now;
    }
  };
};

/**
 * Deep Copy
 */

export const deepCopy = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Merge Objects
 */

export const mergeObjects = (obj1, obj2) => {
  return { ...obj1, ...obj2 };
};

export default {
  DOM,
  Validator,
  String,
  Number,
  Date,
  Storage,
  Array,
  Alert,
  API,
  debounce,
  throttle,
  deepCopy,
  mergeObjects
};
