import { Request, Response } from 'express';
import { ShopService } from '../services/shop.service';
import { createSuccessResponse, createErrorResponse, ApiError } from '../interfaces/ApiResponse';
import { AuthRequest } from '../middleware/auth.middleware';
import { UserService } from '../services/user.service';
import { UserShopService } from '../services/userShop.service';
import { UserRole } from '../entities/UserShop';

export class ShopController {
    private shopService: ShopService;
    private userService: UserService;
    private userShopService: UserShopService;

    constructor() {
        this.shopService = new ShopService();
        this.userService = new UserService();
        this.userShopService = new UserShopService();
    }

    createShop = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const shopData = req.body;
            const shop = await this.shopService.createShop(shopData, req.user);
            const user = await this.userService.updateUserDefaultShop(req.user.id, shop.id);
            await this.userShopService.createUserShop(req.user, shop, UserRole.OWNER);
            const resData = {
                id: shop.id,
                name: shop.name,
                is_default: user.additional_data.default_shop_id === shop.id
            };
            res.status(201).json(createSuccessResponse(resData, 'Shop created successfully'));
        } catch (error) {
            const apiError = error instanceof ApiError ? error : new ApiError('Failed to create shop');
            res.status(400).json(createErrorResponse(apiError));
        }
    };

    getShops = async (req: AuthRequest, res: Response): Promise<void> => {
        try {

            const shops = await this.userShopService.getUserShops(req.user.id);
            const shopsData = shops.map(usershop => ({
                id: usershop.shop.id,
                name: usershop.shop.name,
                is_default: req.user.additional_data.default_shop_id === usershop.shop.id,
                role: usershop.role
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
                ...shop
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
                name: shop.name
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
                name: shop.name
            };
            res.json(createSuccessResponse(shopData, 'Shop set as default successfully'));
        } catch (error) {
            const apiError = error instanceof ApiError ? error : new ApiError('Failed to set default shop');
            res.status(error instanceof ApiError && error.code === 'SHOP_NOT_FOUND' ? 404 : 400)
                .json(createErrorResponse(apiError));
        }
    };
}