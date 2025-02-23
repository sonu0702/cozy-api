import { Response } from 'express';
import { ProductService } from '../services/product.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { createSuccessResponse, createErrorResponse, ApiError } from '../interfaces/ApiResponse';

export class ProductController {
    private productService: ProductService;

    constructor() {
        this.productService = new ProductService();
    }

    bulkCreateProducts = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { shopId } = req.params;
            const products = req.body;

            if (!Array.isArray(products)) {
                throw new ApiError('Products must be an array', 'VALIDATION_ERROR');
            }

            const result = await this.productService.bulkCreateProducts(products, shopId);
            res.status(201).json(createSuccessResponse(result, 'Products created successfully'));
        } catch (error) {
            const apiError = error instanceof ApiError ? error : new ApiError('Failed to create products');
            res.status(400).json(createErrorResponse(apiError));
        }
    }

    createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { shopId } = req.params;
            const product = await this.productService.createProduct(req.body, shopId);
            res.status(201).json(createSuccessResponse(product, 'Product created successfully'));
        } catch (error) {
            const apiError = error instanceof ApiError ? error : new ApiError('Failed to create product');
            res.status(400).json(createErrorResponse(apiError));
        }
    };

    getProducts = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { shopId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const { products, total } = await this.productService.getProducts(shopId, page, limit);
            res.json(createSuccessResponse({
                products,
                pagination: {
                    total,
                    page,
                    limit,
                    total_pages: Math.ceil(total / limit)
                }
            }, 'Products retrieved successfully'));
        } catch (error) {
            const apiError = error instanceof ApiError ? error : new ApiError('Failed to fetch products');
            res.status(400).json(createErrorResponse(apiError));
        }
    };

    getProduct = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const product = await this.productService.getProductById(req.params.id);
            res.json(createSuccessResponse(product, 'Product retrieved successfully'));
        } catch (error) {
            const apiError = error instanceof ApiError ? error : new ApiError('Failed to fetch product');
            res.status(error instanceof ApiError && error.code === 'PRODUCT_NOT_FOUND' ? 404 : 400)
                .json(createErrorResponse(apiError));
        }
    };

    updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const product = await this.productService.updateProduct(req.params.id, req.body);
            res.json(createSuccessResponse(product, 'Product updated successfully'));
        } catch (error) {
            const apiError = error instanceof ApiError ? error : new ApiError('Failed to update product');
            res.status(error instanceof ApiError && error.code === 'PRODUCT_NOT_FOUND' ? 404 : 400)
                .json(createErrorResponse(apiError));
        }
    };

    deleteProduct = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            await this.productService.deleteProduct(req.params.id);
            res.json(createSuccessResponse(null, 'Product deleted successfully'));
        } catch (error) {
            const apiError = error instanceof ApiError ? error : new ApiError('Failed to delete product');
            res.status(error instanceof ApiError && error.code === 'PRODUCT_NOT_FOUND' ? 404 : 400)
                .json(createErrorResponse(apiError));
        }
    };

    searchProducts = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { shopId } = req.params;
            const { query } = req.query;
            if (!query || typeof query !== 'string') {
                throw new ApiError('Search query is required', 'INVALID_QUERY');
            }
            const products = await this.productService.searchProducts(shopId, query);
            res.json(createSuccessResponse(products, 'Products searched successfully'));
        } catch (error) {
            const apiError = error instanceof ApiError ? error : new ApiError('Failed to search products');
            res.status(400).json(createErrorResponse(apiError));
        }
    };
}