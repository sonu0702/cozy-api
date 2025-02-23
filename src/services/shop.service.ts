import { Repository } from 'typeorm';
import { Shop } from '../entities/Shop';
import { User } from '../entities/User';
import { AppDataSource } from '../config/database';
import { logger } from '../utils/logger';
import { ApiError } from '../interfaces/ApiResponse';
import { withTransaction } from '../utils/transaction';
import { UserShop } from '../entities/UserShop';
import { UserService } from './user.service';
import { UserShopService } from './userShop.service';
import { UserRole } from '../entities/UserShop';

export class ShopService {
    private shopRepository: Repository<Shop>;
    private userServerice: UserService;
    private userShopServerice: UserShopService;

    constructor() {
        this.shopRepository = AppDataSource.getRepository(Shop);
        this.userServerice = new UserService();
        this.userShopServerice = new UserShopService();
    }

    async createShop(shopData: Partial<Shop>, user: User): Promise<Shop> {
        return withTransaction(async (queryRunner) => {
            const shop = this.shopRepository.create({
                ...shopData,
            });

            await queryRunner.manager.save(shop);

            // Create UserShop association with OWNER role
            const userShop = queryRunner.manager.create(UserShop, {
                user_id: user.id,
                shop_id: shop.id,
                user: user,
                shop: shop,
                role: UserRole.OWNER
            });
            await queryRunner.manager.save(userShop);

            logger.info(`Shop created successfully: ${shop.name}`);
            return shop;
        }, 'Error in shop creation');
    }

    async getShopsByUser(userId: string): Promise<Shop[]> {
        try {
            const userShops = await this.userShopServerice.getUserShops(userId);
            let listShopWithRole =  userShops.map(userShop => {
                return {
                ...userShop.shop,
                role: userShop.role
               }
            });
            return listShopWithRole;
        } catch (error) {
            logger.error('Error fetching shops:', error);
            throw new ApiError('Failed to fetch shops', 'SHOP_FETCH_ERROR');
        }
    }

    async getShopById(id: string): Promise<Shop> {
        try {
            const shop = await this.shopRepository.findOne({
                where: { id }
            });

            if (!shop) {
                throw new ApiError('Shop not found', 'SHOP_NOT_FOUND');
            }

            return shop;
        } catch (error) {
            if (error instanceof ApiError) throw error;
            logger.error('Error fetching shop:', error);
            throw new ApiError('Failed to fetch shop', 'SHOP_FETCH_ERROR');
        }
    }

    async updateShop(id: string, shopData: Partial<Shop>): Promise<Shop> {
        return withTransaction(async (queryRunner) => {
            const shop = await this.getShopById(id);
            Object.assign(shop, shopData);
            await queryRunner.manager.save(shop);
            return shop;
        }, 'Error updating shop');
    }

    async deleteShop(id: string): Promise<void> {
        return withTransaction(async (queryRunner) => {
            const shop = await this.getShopById(id);
            await queryRunner.manager.remove(shop);
        }, 'Error deleting shop');
    }

    async setDefaultShop(id: string, userId: string): Promise<Shop> {
        let usershop = await this.userShopServerice.getUserShop(userId,id);
        if(!usershop) {
            throw new ApiError('Failed to update default shop', 'SHOP_UPDATE_ERROR');
        }
        await this.userServerice.updateUserDefaultShop(userId, id);
        return usershop.shop;
    }

    async createDefaultShop(user: User): Promise<Shop> {
        return withTransaction(async (queryRunner) => {
            const defaultShop = this.shopRepository.create({
                name: `${user.username}'s Shop`,
                address: 'Default Address',
                state: 'Default State',
                pin: '000000',
            });

            await queryRunner.manager.save(defaultShop);

            // Create UserShop association with OWNER role
            const userShop = queryRunner.manager.create(UserShop, {
                user_id: user.id,
                shop_id: defaultShop.id,
                user: user,
                shop: defaultShop,
                role: UserRole.OWNER
            });
            await queryRunner.manager.save(userShop);

            logger.info(`Default shop created for user: ${user.username}`);
            //make thip shop default shop
            await this.userServerice.updateUserDefaultShop(user.id, defaultShop.id);
            return defaultShop;
        }, 'Error creating default shop');
    }
}