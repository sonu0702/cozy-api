import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { logger } from '../utils/logger';
import { createSuccessResponse, createErrorResponse, ApiError } from '../interfaces/ApiResponse';
import { AppDataSource } from '../config/database';
import { UserShop } from '../entities/UserShop';

export class UserController {
    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    register = async (req: Request, res: Response): Promise<void> => {
        try {
            const { email, username, password } = req.body;

            if (!username || !password) {
                throw new ApiError('Username and password are required', 'VALIDATION_ERROR');
            }

            const user = await this.userService.register(email, username, password);
            const userData = {
                id: user.id,
                email: user.email,
                username: user.username
            };
            res.status(201).json(createSuccessResponse(userData, 'User registered successfully'));
        } catch (error) {
            logger.error('Registration error:', error);
            const apiError = error instanceof ApiError ? error : new ApiError('Error registering user');
            res.status(500).json(createErrorResponse(apiError));
        }
    };

    login = async (req: Request, res: Response): Promise<void> => {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                throw new ApiError('Missing credentials', 'VALIDATION_ERROR');
            }

            const { user, token, default_shop } = await this.userService.login(username, password);
            res.status(200).json(createSuccessResponse(
                {
                    user: { id: user.id, email: user.email, username: user.username },
                    token,
                    default_shop: default_shop
                },
                'Login successful'
            ));
        } catch (error) {
            logger.error('Login error:', error);
            const apiError = error instanceof ApiError ? error : new ApiError('Invalid credentials', 'AUTHENTICATION_ERROR');
            res.status(401).json(createErrorResponse(apiError));
        }
    };

    getProfile = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = (req as any).user.id;
            const user = await this.userService.findById(userId);
            const userShopRepository = AppDataSource.getRepository(UserShop);
            let userShops = await userShopRepository.find({
                where: { user_id: user.id },
                relations: ['user','shop']
            });
            const userProfile = {
                id: user.id,
                email: user.email,
                username: user.username,
                shops: userShops.map(userShop => ({
                    id: userShop.shop.id,
                    name: userShop.shop.name,
                    is_default: user.additional_data?.default_shop_id === userShop.shop.id
                }))
            };
            res.status(200).json(createSuccessResponse(userProfile));
        } catch (error) {
            logger.error('Error fetching user profile:', error);
            const apiError = error instanceof ApiError ? error : new ApiError('Error fetching user profile');
            res.status(500).json(createErrorResponse(apiError));
        }
    };
}