import { Repository } from 'typeorm';
import { Shop } from '../entities/Shop';
import { User } from '../entities/User';
import { AppDataSource } from '../config/database';
import { logger } from '../utils/logger';
import { ApiError } from '../interfaces/ApiResponse';
import { withTransaction } from '../utils/transaction';

export class ShopService {
    private shopRepository: Repository<Shop>;

    constructor() {
        this.shopRepository = AppDataSource.getRepository(Shop);
    }

    async createShop(shopData: Partial<Shop>, user: User): Promise<Shop> {
        return withTransaction(async (queryRunner) => {
            const shop = this.shopRepository.create({
                ...shopData,
                owned_by: user
            });

            await queryRunner.manager.save(shop);
            logger.info(`Shop created successfully: ${shop.name}`);
            return shop;
        }, 'Error in shop creation');
    }

    async getShopsByUser(userId: string): Promise<Shop[]> {
        try {
            return await this.shopRepository.find({
                where: { owned_by: { id: userId } },
                relations: ['owned_by']
            });
        } catch (error) {
            logger.error('Error fetching shops:', error);
            throw new ApiError('Failed to fetch shops', 'SHOP_FETCH_ERROR');
        }
    }

    async getShopById(id: string): Promise<Shop> {
        try {
            const shop = await this.shopRepository.findOne({
                where: { id },
                relations: ['owned_by']
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
        return withTransaction(async (queryRunner) => {
            await queryRunner.manager
                .createQueryBuilder()
                .update(Shop)
                .set({ is_default: false })
                .where("owned_by_id = :userId", { userId })
                .execute();

            const shop = await this.getShopById(id);
            if (shop.owned_by.id !== userId) {
                throw new ApiError('Unauthorized access to shop', 'SHOP_ACCESS_DENIED');
            }

            shop.is_default = true;
            await queryRunner.manager.save(shop);
            logger.info(`Shop set as default: ${shop.name}`);
            return shop;
        }, 'Error setting default shop');
    }

    async createDefaultShop(user: User): Promise<Shop> {
        try {
            const defaultShop = this.shopRepository.create({
                name: `${user.username}'s Shop`,
                address: 'Default Address',
                state: 'Default State',
                pin: '000000',
                owned_by: user,
                is_default: true
            });

            await this.shopRepository.save(defaultShop);
            logger.info(`Default shop created for user: ${user.username}`);
            return defaultShop;
        } catch (error) {
            logger.error('Error creating default shop:', error);
            throw new ApiError('Failed to create default shop', 'SHOP_CREATE_ERROR');
        }
    }
}