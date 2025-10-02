// Admin Performance Utilities
// Debounce function to prevent excessive function calls
export function debounce(func, wait) {
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

// Throttle function for scroll events
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Request Animation Frame wrapper for smooth updates
export function rafUpdate(callback) {
  let ticking = false;
  
  return function(...args) {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        callback.apply(this, args);
        ticking = false;
      });
      ticking = true;
    }
  };
}

// Lazy load images
export function lazyLoadImages() {
  const images = document.querySelectorAll('img[data-src]');
  
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        observer.unobserve(img);
      }
    });
  });
  
  images.forEach(img => imageObserver.observe(img));
}

// Optimize table rendering with virtual scrolling concept
export function optimizeTableRendering(tableBody, data, renderRow, chunkSize = 50) {
  // Clear existing content
  tableBody.innerHTML = '';
  
  // Render in chunks to prevent blocking
  let index = 0;
  
  function renderChunk() {
    const end = Math.min(index + chunkSize, data.length);
    const fragment = document.createDocumentFragment();
    
    for (let i = index; i < end; i++) {
      const row = document.createElement('tr');
      row.innerHTML = renderRow(data[i], i);
      fragment.appendChild(row);
    }
    
    tableBody.appendChild(fragment);
    index = end;
    
    if (index < data.length) {
      requestAnimationFrame(renderChunk);
    }
  }
  
  if (data.length > 0) {
    requestAnimationFrame(renderChunk);
  }
}

// Prevent memory leaks in charts
export function destroyChart(chartInstance) {
  if (chartInstance && typeof chartInstance.destroy === 'function') {
    chartInstance.destroy();
    chartInstance = null;
  }
}

// Batch DOM updates
export function batchDOMUpdates(updates) {
  requestAnimationFrame(() => {
    updates.forEach(update => update());
  });
}

// Optimize modal opening/closing
export function optimizeModal(modalId, shouldOpen) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  
  if (shouldOpen) {
    // Use requestAnimationFrame for smooth opening
    requestAnimationFrame(() => {
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    });
  } else {
    // Smooth closing
    requestAnimationFrame(() => {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    });
  }
}

// Cache frequently accessed DOM elements
export class DOMCache {
  constructor() {
    this.cache = new Map();
  }
  
  get(selector) {
    if (!this.cache.has(selector)) {
      this.cache.set(selector, document.querySelector(selector));
    }
    return this.cache.get(selector);
  }
  
  getAll(selector) {
    if (!this.cache.has(selector)) {
      this.cache.set(selector, document.querySelectorAll(selector));
    }
    return this.cache.get(selector);
  }
  
  clear() {
    this.cache.clear();
  }
}

// Prevent excessive API calls
export class APIThrottle {
  constructor(delay = 1000) {
    this.lastCall = 0;
    this.delay = delay;
  }
  
  canCall() {
    const now = Date.now();
    if (now - this.lastCall >= this.delay) {
      this.lastCall = now;
      return true;
    }
    return false;
  }
  
  reset() {
    this.lastCall = 0;
  }
}

// Optimize event listeners
export function addOptimizedListener(element, event, handler, options = {}) {
  const optimizedHandler = event === 'scroll' || event === 'resize' 
    ? throttle(handler, options.throttle || 100)
    : handler;
  
  element.addEventListener(event, optimizedHandler, { passive: true, ...options });
  
  return () => element.removeEventListener(event, optimizedHandler);
}

// Performance monitoring
export class PerformanceMonitor {
  constructor(name) {
    this.name = name;
    this.marks = new Map();
  }
  
  start(label) {
    this.marks.set(label, performance.now());
  }
  
  end(label) {
    const startTime = this.marks.get(label);
    if (startTime) {
      const duration = performance.now() - startTime;
      console.log(`[${this.name}] ${label}: ${duration.toFixed(2)}ms`);
      this.marks.delete(label);
      return duration;
    }
  }
  
  measure(label, fn) {
    this.start(label);
    const result = fn();
    this.end(label);
    return result;
  }
  
  async measureAsync(label, fn) {
    this.start(label);
    const result = await fn();
    this.end(label);
    return result;
  }
}
