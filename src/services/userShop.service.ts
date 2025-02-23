import { Repository } from 'typeorm';
import { UserRole, UserShop } from '../entities/UserShop';
import { User } from '../entities/User';
import { Shop } from '../entities/Shop';
import { AppDataSource } from '../config/database';
import { logger } from '../utils/logger';
import { ApiError } from '../interfaces/ApiResponse';
import { withTransaction } from '../utils/transaction';

export class UserShopService {
    private userShopRepository: Repository<UserShop>;

    constructor() {
        this.userShopRepository = AppDataSource.getRepository(UserShop);
    }

    async createUserShop(user: User, shop: Shop, role: UserRole): Promise<UserShop> {
        return withTransaction(async (queryRunner) => {
            const existingUserShop = await this.userShopRepository.findOne({
                where: { user: { id: user.id }, shop: { id: shop.id } },
                relations: ['user', 'shop']
            });

            if (existingUserShop) {
                throw new ApiError('User is already associated with this shop', 'USER_SHOP_EXISTS');
            }

            const userShop = this.userShopRepository.create({
                user_id: user.id,
                shop_id: shop.id,
                user: user,
                shop: shop,
                role: role
            });

            await queryRunner.manager.save(userShop);
            logger.info(`User-Shop association created successfully for user ${user.id} and shop ${shop.id}`);
            return userShop;
        }, 'Error in user-shop association creation');
    }

    async getUserShops(userId: string): Promise<UserShop[]> {
        try {
            return await this.userShopRepository.find({
                where: { user: { id: userId } },
                relations: ['user', 'shop']
            });
        } catch (error) {
            logger.error('Error fetching user shops:', error);
            throw new ApiError('Failed to fetch user shops', 'USER_SHOP_FETCH_ERROR');
        }
    }

    async getShopUsers(shopId: string): Promise<UserShop[]> {
        try {
            return await this.userShopRepository.find({
                where: { shop: { id: shopId } },
                relations: ['user', 'shop']
            });
        } catch (error) {
            logger.error('Error fetching shop users:', error);
            throw new ApiError('Failed to fetch shop users', 'SHOP_USERS_FETCH_ERROR');
        }
    }

    async getUserShop(userId: string, shopId: string): Promise<UserShop> {
        try {
            const userShop = await this.userShopRepository.findOne({
                where: { user: { id: userId }, shop: { id: shopId } },
                relations: ['user', 'shop']
            });

            if (!userShop) {
                throw new ApiError('User-Shop association not found', 'USER_SHOP_NOT_FOUND');
            }

            return userShop;
        } catch (error) {
            if (error instanceof ApiError) throw error;
            logger.error('Error fetching user-shop association:', error);
            throw new ApiError('Failed to fetch user-shop association', 'USER_SHOP_FETCH_ERROR');
        }
    }

    async updateUserShopRole(userId: string, shopId: string, role: string): Promise<UserShop> {
        return withTransaction(async (queryRunner) => {
            const userShop = await this.getUserShop(userId, shopId);
            userShop.role = role as UserRole;
            await queryRunner.manager.save(userShop);
            logger.info(`User role updated for user ${userId} in shop ${shopId}`);
            return userShop;
        }, 'Error updating user-shop role');
    }

    async deleteUserShop(userId: string, shopId: string): Promise<void> {
        return withTransaction(async (queryRunner) => {
            const userShop = await this.getUserShop(userId, shopId);
            await queryRunner.manager.remove(userShop);
            logger.info(`User-Shop association removed for user ${userId} and shop ${shopId}`);
        }, 'Error deleting user-shop association');
    }

    async isUserAssociatedWithShop(userId: string, shopId: string): Promise<boolean> {
        try {
            const userShop = await this.userShopRepository.findOne({
                where: { user: { id: userId }, shop: { id: shopId } }
            });
            return !!userShop;
        } catch (error) {
            logger.error('Error checking user-shop association:', error);
            throw new ApiError('Failed to check user-shop association', 'USER_SHOP_CHECK_ERROR');
        }
    }
}