export const APP_CONSTANTS = {
    // Pagination defaults
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100,
    
    // User roles
    ROLES: {
      CUSTOMER: 'customer',
      ADMIN: 'admin',
      VENDOR: 'vendor'
    },
    
    // Order statuses
    ORDER_STATUS: {
      PENDING: 'pending',
      PROCESSING: 'processing',
      SHIPPED: 'shipped',
      DELIVERED: 'delivered',
      CANCELLED: 'cancelled',
      RETURNED: 'returned',
      REFUNDED: 'refunded'
    },
    
    // Payment statuses
    PAYMENT_STATUS: {
      PENDING: 'pending',
      COMPLETED: 'completed',
      FAILED: 'failed',
      REFUNDED: 'refunded'
    },
    
    // File upload limits
    UPLOAD_LIMITS: {
      IMAGE_SIZE_LIMIT: 5 * 1024 * 1024, // 5MB
      MAX_IMAGES_PER_PRODUCT: 10
    },
    
    // API Rate limiting
    RATE_LIMIT: {
      WINDOW_MS: 15 * 60 * 1000, // 15 minutes
      MAX_REQUESTS: 100 // limit each IP to 100 requests per windowMs
    }
  };