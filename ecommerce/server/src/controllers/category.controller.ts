import { Request, Response } from 'express';
import  Category  from '../models/Category.model.js';
import  Product  from '../models/Product.model.js';
import { sendSuccess, sendError, ErrorCodes } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';

export const categoryController = {
  // Create a new category
  createCategory: async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, description, parentId } = req.body;
      
      // Check if category with same name exists
      const existingCategory = await Category.findOne({ name });
      if (existingCategory) {
        sendError(res, 'Category with this name already exists', 409, ErrorCodes.CONFLICT);
        return;
      }
      
      // Check if parent category exists if provided
      if (parentId) {
        const parentCategory = await Category.findById(parentId);
        if (!parentCategory) {
          sendError(res, 'Parent category not found', 404, ErrorCodes.NOT_FOUND);
          return;
        }
      }
      
      // Create category
      const category = new Category({
        name,
        description,
        parent: parentId || null
      });
      
      await category.save();
      
      sendSuccess(res, { category }, 'Category created successfully', 201);
    } catch (error) {
      logger.error(`Create category error: ${error}`);
      sendError(res, 'Failed to create category', 500);
    }
  },
  
  // Get all categories with optional tree structure
  getAllCategories: async (req: Request, res: Response): Promise<void> => {
    try {
      const { tree = 'false' } = req.query as any;
      
      if (tree === 'true') {
        // Get only root categories (no parent)
        const rootCategories = await Category.find({ parent: null })
          .populate({
            path: 'subcategories',
            populate: {
              path: 'subcategories'
            }
          });
        
        sendSuccess(res, { categories: rootCategories }, 'Categories retrieved successfully');
      } else {
        // Get flat list of all categories
        const categories = await Category.find().populate('parent', 'name');
        
        sendSuccess(res, { categories }, 'Categories retrieved successfully');
      }
    } catch (error) {
      logger.error(`Get all categories error: ${error}`);
      sendError(res, 'Failed to retrieve categories', 500);
    }
  },
  
  // Get a single category by ID
  getCategoryById: async (req: Request, res: Response): Promise<void> => {
    try {
      const categoryId = req.params.id;
      
      const category = await Category.findById(categoryId)
        .populate('parent', 'name')
        .populate('subcategories', 'name description');
      
      if (!category) {
        sendError(res, 'Category not found', 404, ErrorCodes.NOT_FOUND);
        return;
      }
      
      sendSuccess(res, { category }, 'Category retrieved successfully');
    } catch (error) {
      logger.error(`Get category by ID error: ${error}`);
      sendError(res, 'Failed to retrieve category', 500);
    }
  },
  
  // Get products by category ID
  getProductsByCategory: async (req: Request, res: Response): Promise<void> => {
    try {
      const categoryId = req.params.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      
      // Check if category exists
      const category = await Category.findById(categoryId);
      if (!category) {
        sendError(res, 'Category not found', 404, ErrorCodes.NOT_FOUND);
        return;
      }
      
      // Get all subcategory IDs recursively
      const getAllSubcategoryIds = async (categoryId: string): Promise<string[]> => {
        const subcategories = await Category.find({ parent: categoryId });
        let ids = [categoryId];
        
        for (const subcategory of subcategories) {
          const subIds = await getAllSubcategoryIds(subcategory._id.toString());
          ids = [...ids, ...subIds];
        }
        
        return ids;
      };
      
      const categoryIds = await getAllSubcategoryIds(categoryId);
      
      // Find products in this category and its subcategories
      const query = { 
        category: { $in: categoryIds },
        // Only show active products to non-admin users
        ...((!req.user || req.user.role !== 'admin') ? { isActive: true } : {})
      };
      
      const products = await Product.find(query)
        .populate('category', 'name')
        .skip(skip)
        .limit(limit);
      
      const total = await Product.countDocuments(query);
      
      sendSuccess(res, {
        category,
        products,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }, 'Products retrieved successfully');
    } catch (error) {
      logger.error(`Get products by category error: ${error}`);
      sendError(res, 'Failed to retrieve products', 500);
    }
  },
  
  // Update a category
  updateCategory: async (req: Request, res: Response): Promise<void> => {
    try {
      const categoryId = req.params.id;
      const { name, description, parentId } = req.body;
      
      // Check if category with same name exists (excluding this one)
      if (name) {
        const existingCategory = await Category.findOne({ 
          name, 
          _id: { $ne: categoryId } 
        });
        
        if (existingCategory) {
          sendError(res, 'Category with this name already exists', 409, ErrorCodes.CONFLICT);
          return;
        }
      }
      
      // Prevent category from being its own parent
      if (parentId && parentId === categoryId) {
        sendError(res, 'Category cannot be its own parent', 400, ErrorCodes.BAD_REQUEST);
        return;
      }
      
      // Check if parent category exists
      if (parentId) {
        const parentCategory = await Category.findById(parentId);
        if (!parentCategory) {
          sendError(res, 'Parent category not found', 404, ErrorCodes.NOT_FOUND);
          return;
        }
        
        // Check for circular reference
        let currentParent = parentCategory;
        while (currentParent.parent) {
          if (currentParent.parent.toString() === categoryId) {
            sendError(res, 'Circular reference detected in category hierarchy', 400, ErrorCodes.BAD_REQUEST);
            return;
          }
          currentParent = await Category.findById(currentParent.parent);
        }
      }
      
      // Update category
      const updatedCategory = await Category.findByIdAndUpdate(
        categoryId,
        {
          name,
          description,
          parent: parentId || null
        },
        { new: true, runValidators: true }
      );
      
      if (!updatedCategory) {
        sendError(res, 'Category not found', 404, ErrorCodes.NOT_FOUND);
        return;
      }
      
      sendSuccess(res, { category: updatedCategory }, 'Category updated successfully');
    } catch (error) {
      logger.error(`Update category error: ${error}`);
      sendError(res, 'Failed to update category', 500);
    }
  },
  
  // Delete a category
  deleteCategory: async (req: Request, res: Response): Promise<void> => {
    try {
      const categoryId = req.params.id;
      
      // Check if category has products
      const productsCount = await Product.countDocuments({ category: categoryId });
      if (productsCount > 0) {
        sendError(res, 'Cannot delete a category with products', 400, ErrorCodes.BAD_REQUEST);
        return;
      }
      
      // Check if category has subcategories
      const subcategoriesCount = await Category.countDocuments({ parent: categoryId });
      if (subcategoriesCount > 0) {
        sendError(res, 'Cannot delete a category with subcategories', 400, ErrorCodes.BAD_REQUEST);
        return;
      }
      
      const category = await Category.findByIdAndDelete(categoryId);
      
      if (!category) {
        sendError(res, 'Category not found', 404, ErrorCodes.NOT_FOUND);
        return;
      }
      
      sendSuccess(res, null, 'Category deleted successfully');
    } catch (error) {
      logger.error(`Delete category error: ${error}`);
      sendError(res, 'Failed to delete category', 500);
    }
  }
};