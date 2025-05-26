/**
 * This file outlines the relationships between different models in the system
 * for reference purposes. These relationships are already implemented in the 
 * actual model schemas but are documented here for clarity.
 */

export const modelRelationships = {
    User: {
      hasMany: ['Order', 'Review', 'Wishlist'],
      hasOne: ['Cart']
    },
    
    Product: {
      belongsTo: ['Category', 'User' /* as createdBy */],
      hasMany: ['Review', 'InventoryActivity'],
      belongsToMany: ['Order', 'Cart', 'Wishlist', 'Coupon']
    },
    
    Category: {
      hasMany: ['Product', 'Category' /* as subcategories */],
      belongsTo: ['Category' /* as parent */],
      belongsToMany: ['Coupon']
    },
    
    Order: {
      belongsTo: ['User'],
      belongsToMany: ['Product']
    },
    
    Cart: {
      belongsTo: ['User'],
      belongsToMany: ['Product']
    },
    
    Review: {
      belongsTo: ['User', 'Product']
    },
    
    Coupon: {
      belongsTo: ['User' /* as createdBy */],
      belongsToMany: ['Product', 'Category', 'User' /* as usedBy */]
    },
    
    Wishlist: {
      belongsTo: ['User'],
      belongsToMany: ['Product']
    },
    
    InventoryActivity: {
      belongsTo: ['Product', 'User' /* as performedBy */]
    }
  };