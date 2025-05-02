import { Request, Response } from 'express';
import Product from '../models/Product.model.js';
import Category from '../models/Category.model.js';
import { sendSuccess, sendError, ErrorCodes } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';
import { Types } from 'mongoose';
import { AuthenticatedRequest } from '../types/user.types.js';
import { ProductStatus } from '../types/product.types.js'

interface CreateProductBody  {
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  variants: Array<{
    sku: string;
    price: number;
    compareAtPrice?: number;
    inventory?: number;
    weight?: number;
    barcode?: string;
  }>;
  tags?: string;
  specifications?: string | object;
  discount?: number;
  status?: string;
}

interface UpdateProductBody extends Partial<CreateProductBody> {
  removeImages?: string;
}

export const productController = {
  // Create a new product with variants
  createProduct: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { 
        name,
        slug,
        description,
        categoryId,
        variants,
        tags,
        specifications,
        discount,
        status
      } = req.body;


      // Validate required fields
      if (!name || !slug || !description || !categoryId || !variants || variants.length === 0) {
        sendError(res, 'Missing required fields',  ErrorCodes.VALIDATION_ERROR);
        return;
      }

      // Check if category exists
      const category = await Category.findById(categoryId);
      if (!category) {
        sendError(res, 'Category not found', ErrorCodes.NOT_FOUND);
        return;
      }

      // Handle image uploads
      const images = req.files && Array.isArray(req.files) 
        ? (req.files as Express.MulterS3.File[]).map(file => file.location)
        : [];

      // Prepare variants (first one will be default via pre-save hook)
      const preparedVariants = variants.map((variant: {
        sku: string;
        price: number;
        compareAtPrice?: number;
        inventory?: number;
        weight?: number;
        barcode?: string;
      }, index: number) => ({
        ...variant,
        inventory: variant.inventory || 0,
        images: index === 0 ? images : [], // Assign images to first variant
        isDefault: index === 0 // Will be corrected by pre-save if needed
      }));

      // Create product
      const product = new Product({
        name,
        slug,
        description,
        category: categoryId,
        variants: preparedVariants,
        status: status || 'draft',
        tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((tag: string) => tag.trim()) ) : [],
        specifications: typeof specifications === 'string' 
          ? JSON.parse(specifications) 
          : specifications,
        discount: discount || 0,
        createdBy: req.user._id
      });

      await product.save();
      
      sendSuccess(res, { product }, 'Product created successfully', 201);
    } catch (error) {
      logger.error(`Create product error: ${error}`);
      sendError(res, 'Failed to create product', 500);
    }
  },

  // Get all products with filtering and pagination
  getAllProducts: async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        page = '1',
        limit = '10',
        sort = 'createdAt',
        order = 'desc',
        category,
        minPrice,
        maxPrice,
        search,
        tags,
        status
      } = req.query;

      // Build query
      const query: Record<string, any> = {};

      // Category filter
      if (category && Types.ObjectId.isValid(category as string)) {
        query.category = category;
      }

      // Price range filter (using variants)
      if (minPrice || maxPrice) {
        query['variants.price'] = {};
        if (minPrice) query['variants.price'].$gte = Number(minPrice);
        if (maxPrice) query['variants.price'].$lte = Number(maxPrice);
      }

      // Search by name or description
      if (search) {
        query.$or = [
          { name: { $regex: search as string, $options: 'i' } },
          { description: { $regex: search as string, $options: 'i' } }
        ];
      }

      // Tags filter
      if (tags) {
        query.tags = { $in: (tags as string).split(',').map(tag => tag.trim()) };
      }

      // Status filter
      if (status) {
        query.status = status;
      }

      // For non-admin users, only show active products
      if (!req.user || req.user.role !== 'admin') {
        query.status = 'active';
      }

      // Pagination
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Sorting
      const sortOptions: Record<string, any> = {};
      sortOptions[sort as string] = order === 'desc' ? -1 : 1;

      // Execute query
      const products = await Product.find(query)
        .populate('category', 'name')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum);

      // Get total count
      const total = await Product.countDocuments(query);

      sendSuccess(res, {
        products,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
        }
      }, 'Products retrieved successfully');
    } catch (error) {
      logger.error(`Get all products error: ${error}`);
      sendError(res, 'Failed to retrieve products', 500);
    }
  },

  // Get a single product by ID
  getProductById: async (req: Request, res: Response): Promise<void> => {
    try {
      const productId = req.params.id;
      
      const product = await Product.findById(productId)
        .populate('category', 'name')
        .populate('createdBy', 'name');

      if (!product) {
        sendError(res, 'Product not found',  ErrorCodes.NOT_FOUND);
        return;
      }

      // For non-admin users, check status
      if (!req.user || req.user.role !== 'admin') {
        if (product.status !== 'active') {
          sendError(res, 'Product not found', ErrorCodes.NOT_FOUND);
          return;
        }
      }

      sendSuccess(res, { product }, 'Product retrieved successfully');
    } catch (error) {
      logger.error(`Get product by ID error: ${error}`);
      sendError(res, 'Failed to retrieve product', 500);
    }
  },

  // Update a product
  updateProduct: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const productId = req.params.id;
      const {
        name,
        description,
        categoryId,
        variants,
        tags,
        specifications,
        discount,
        status,
        removeImages
      } = req.body;

      // Find product
      const product = await Product.findById(productId);
      
      if (!product) {
        sendError(res, 'Product not found', ErrorCodes.NOT_FOUND);
        return;
      }

      // Check if category exists
      if (categoryId) {
        const category = await Category.findById(categoryId);
        if (!category) {
          sendError(res, 'Category not found', ErrorCodes.NOT_FOUND);
          return;
        }
      }

      // Handle image updates
      let images = [...product.images];
      
      // Remove selected images if any
      if (removeImages) {
        const imagesToRemove = removeImages.split(',').map((img: string) => img.trim());
        images = images.filter(img => !imagesToRemove.includes(img));
      }

      // Add new images if any
      if (req.files && Array.isArray(req.files)) {
        const newImages = (req.files as Express.MulterS3.File[]).map(file => file.location);
        images = [...images, ...newImages];
      }

      // Prepare update data
      const updateData: Record<string, any> = {
        name: name || product.name,
        description: description || product.description,
        category: categoryId || product.category,
        tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : product.tags,
        images,
        specifications: specifications 
          ? (typeof specifications === 'string' 
              ? JSON.parse(specifications) 
              : specifications)
          : product.specifications,
        discount: discount !== undefined ? discount : product.discount,
        updatedBy: req.user._id
      };

      // Only update status if provided and valid
      if (status && Object.values(ProductStatus).includes(status as ProductStatus)) {
        updateData.status = status;
      }

      // Update variants if provided
      if (variants && variants.length > 0) {
        updateData.variants = variants.map((variant: {
          sku: string;
          price: number;
          compareAtPrice?: number;
          inventory?: number;
          weight?: number;
          barcode?: string;
        }) => ({
          ...variant,
          inventory: variant.inventory ?? 0
        }));
      }

      const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        updateData,
        { new: true, runValidators: true }
      ).populate('category', 'name');

      sendSuccess(res, { product: updatedProduct }, 'Product updated successfully');
    } catch (error) {
      logger.error(`Update product error: ${error}`);
      sendError(res, 'Failed to update product', 500);
    }
  },

  // Delete a product
  deleteProduct: async (req: Request, res: Response): Promise<void> => {
    try {
      const productId = req.params.id;
      
      const product = await Product.findByIdAndDelete(productId);
      
      if (!product) {
        sendError(res, 'Product not found', ErrorCodes.NOT_FOUND);
        return;
      }
      
      sendSuccess(res, null, 'Product deleted successfully');
    } catch (error) {
      logger.error(`Delete product error: ${error}`);
      sendError(res, 'Failed to delete product', 500);
    }
  }
};