import { Request, Response } from 'express';
import { ShopService } from '../services/shop.service';
import { createSuccessResponse, createErrorResponse, ApiError } from '../interfaces/ApiResponse';
import { AuthRequest } from '../middleware/auth.middleware';

export class ShopController {
    private shopService: ShopService;

    constructor() {
        this.shopService = new ShopService();
    }

    createShop = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const shopData = req.body;
            const shop = await this.shopService.createShop(shopData, req.user);
            const resData = {
                id: shop.id,
                name: shop.name,
                is_default: shop.is_default,
                owned_by: {
                    id: shop.owned_by.id,
                    email: shop.owned_by.email,
                    username: shop.owned_by.username
                }
            };
            res.status(201).json(createSuccessResponse(resData, 'Shop created successfully'));
        } catch (error) {
            const apiError = error instanceof ApiError ? error : new ApiError('Failed to create shop');
            res.status(400).json(createErrorResponse(apiError));
        }
    };

    getShops = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const shops = await this.shopService.getShopsByUser(req.user.id);
            const shopsData = shops.map(shop => ({
                id: shop.id,
                name: shop.name,
                is_default: shop.is_default,
                owned_by: {
                    id: shop.owned_by.id,
                    email: shop.owned_by.email,
                    username: shop.owned_by.username
                }
            }));
            res.json(createSuccessResponse(shopsData, 'Shops retrieved successfully'));
        } catch (error) {
            const apiError = error instanceof ApiError ? error : new ApiError('Failed to fetch shops');
            res.status(400).json(createErrorResponse(apiError));
        }
    };

    getShop = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const shop = await this.shopService.getShopById(req.params.id);
            const shopData = {
                ...shop,
                owned_by: {
                    id: shop.owned_by.id,
                    email: shop.owned_by.email,
                    username: shop.owned_by.username
                }
            }
            res.json(createSuccessResponse(shopData, 'Shop retrieved successfully'));
        } catch (error) {
            const apiError = error instanceof ApiError ? error : new ApiError('Failed to fetch shop');
            res.status(error instanceof ApiError && error.code === 'SHOP_NOT_FOUND' ? 404 : 400)
                .json(createErrorResponse(apiError));
        }
    };

    updateShop = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const shop = await this.shopService.updateShop(req.params.id, req.body);
            const shopData = {
                id: shop.id,
                name: shop.name,
                is_default: shop.is_default,
                owned_by: {
                    id: shop.owned_by.id,
                    email: shop.owned_by.email,
                    username: shop.owned_by.username
                }
            };
            res.json(createSuccessResponse(shopData, 'Shop updated successfully'));
        } catch (error) {
            const apiError = error instanceof ApiError ? error : new ApiError('Failed to update shop');
            res.status(error instanceof ApiError && error.code === 'SHOP_NOT_FOUND' ? 404 : 400)
                .json(createErrorResponse(apiError));
        }
    };

    deleteShop = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            await this.shopService.deleteShop(req.params.id);
            res.json(createSuccessResponse(null, 'Shop deleted successfully'));
        } catch (error) {
            const apiError = error instanceof ApiError ? error : new ApiError('Failed to delete shop');
            res.status(error instanceof ApiError && error.code === 'SHOP_NOT_FOUND' ? 404 : 400)
                .json(createErrorResponse(apiError));
        }
    };

    setDefaultShop = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const shop = await this.shopService.setDefaultShop(req.params.id, req.user.id);
            const shopData = {
                id: shop.id,
                name: shop.name,
                is_default: shop.is_default,
                owned_by: {
                    id: shop.owned_by.id,
                    email: shop.owned_by.email,
                    username: shop.owned_by.username
                }
            };
            res.json(createSuccessResponse(shopData, 'Shop set as default successfully'));
        } catch (error) {
            const apiError = error instanceof ApiError ? error : new ApiError('Failed to set default shop');
            res.status(error instanceof ApiError && error.code === 'SHOP_NOT_FOUND' ? 404 : 400)
                .json(createErrorResponse(apiError));
        }
    };
}