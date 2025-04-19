import { Request, Response } from 'express';
import  Product  from '../models/Product.model.js';
import  Category  from '../models/Category.model.js';
import { sendSuccess, sendError, ErrorCodes } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';

export const productController = {
  // Create a new product
  createProduct: async (req: Request, res: Response): Promise<void> => {
    try {
      const { 
        name,slug, description, price, categoryId, sku, 
        stockQuantity, isActive, tags, specifications,
        discount
      } = req.body;
      console.log(req.body, req.files);
      
      // Check if category exists
      if (categoryId) {
        const category = await Category.findById(categoryId);
        if (!category) {
          sendError(res, 'Category not found', 404, ErrorCodes.NOT_FOUND);
          return;
        }
      }
      
      // Handle image uploads
      let images: string[] = [];
      if (req.files && Array.isArray(req.files)) {
        images = (req.files as Express.MulterS3.File[]).map(file => file.location);
      }
      
      // Create product
      const product = new Product({
        name,
        slug,
        description,
        price,
        category: categoryId,
        sku,
        stockQuantity: stockQuantity || 0,
        isActive: isActive !== undefined ? isActive : true,
        tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : [],
        images,
        specifications: typeof specifications === 'string' ? JSON.parse(specifications) : specifications,
        discount: discount || 0,
        createdBy: req.user._id
      });
      
      console.log(req.user._id, 'user id');
      await product.save();
      
      sendSuccess(res, { product }, 'Product created successfully', 201);
    } catch (error) {
      logger.error(`Create product error: ${error}`);
      sendError(res, 'Failed to create product', 500);
    }
  },
  
  // Get all products with filtering and pagination
  getAllProducts: async (req: Request, res: Response): Promise<void> => {
    console.log(req.query)
    try {
      const {
        page = 1,
        limit = 10,
        sort = 'createdAt',
        order = 'desc',
        category,
        minPrice,
        maxPrice,
        search,
        tags,
        inStock
      } = req.query as any;

      // console.log(req.query)
      
      // Build query
      const query: any = {};
      
      // Category filter
      if (category) {
        query.category = category;
      }
      
      // Price range filter
      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = Number(minPrice);
        if (maxPrice) query.price.$lte = Number(maxPrice);
      }
      
      // Search by name or description
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Tags filter
      if (tags) {
        query.tags = { $in: tags.split(',').map((tag: string) => tag.trim()) };
      }
      
      // Stock filter
      if (inStock === 'true') {
        query.stockQuantity = { $gt: 0 };
      }
      
      // console.log(req.user.role)
     // Visibility for non-admin users
      // if (!req.user || req.user.role !== 'admin') {
      //   query.isActive = true;
      // } isActive field is missing in the product model

     
      
      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Sorting
      const sortOptions: any = {};
      sortOptions[sort] = order === 'desc' ? -1 : 1;
      
      // Execute query
      const products = await Product.find(query)
        .populate('category', 'name')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit));
      
      // Get total count
      const total = await Product.countDocuments(query);
      
      sendSuccess(res, {
        products,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
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
      // console.log(productId)
      // console.log(await Product.findById(productId))
      
      const product = await Product.findById(productId)
        .populate('category', 'name')
        .populate('createdBy', 'name');
      
      if (!product) {
        sendError(res, 'Product not found', 404, ErrorCodes.NOT_FOUND);
        return;
      }
      
      // Check if product is active for non-admin users
      // if (!product.isActive && (!req.user || req.user.role !== 'admin')) {
      //   sendError(res, 'Product not found', 404, ErrorCodes.NOT_FOUND);
      //   return;
      // }
      // isActive field not included in product model as of now
      
      sendSuccess(res, { product }, 'Product retrieved successfully');
    } catch (error) {
      logger.error(`Get product by ID error: ${error}`);
      sendError(res, 'Failed to retrieve product', 500);
    }
  },
  
  // Update a product
  updateProduct: async (req: Request, res: Response): Promise<void> => {
    try {
      const productId = req.params.id;
      const {
        name, description, price, categoryId, sku,
        stockQuantity, isActive, tags, specifications,
        discount, removeImages
      } = req.body;
      
      // Find product
      const product = await Product.findById(productId);
      
      if (!product) {
        sendError(res, 'Product not found', 404, ErrorCodes.NOT_FOUND);
        return;
      }
      
      // Check if category exists
      if (categoryId) {
        const category = await Category.findById(categoryId);
        if (!category) {
          sendError(res, 'Category not found', 404, ErrorCodes.NOT_FOUND);
          return;
        }
      }
      
      // Handle image uploads and removals
      let images: string[] = [...product.images];
      
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
      
      // Update product
      const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        {
          name: name || product.name,
          description: description || product.description,
          price: price || product.price,
          category: categoryId || product.category,
          sku: sku || product.sku,
          stockQuantity: stockQuantity !== undefined ? stockQuantity : product.stockQuantity,
          isActive: isActive !== undefined ? isActive : product.isActive,
          tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : product.tags,
          images: images,
          specifications: specifications ? JSON.parse(specifications) : product.specifications,
          discount: discount !== undefined ? discount : product.discount
        },
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
        sendError(res, 'Product not found', 404, ErrorCodes.NOT_FOUND);
        return;
      }
      
      sendSuccess(res, null, 'Product deleted successfully');
    } catch (error) {
      logger.error(`Delete product error: ${error}`);
      sendError(res, 'Failed to delete product', 500);
    }
  }
};