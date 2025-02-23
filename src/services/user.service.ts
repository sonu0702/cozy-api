import { Repository } from 'typeorm';
import { sign } from 'jsonwebtoken';
import { User } from '../entities/User';
import { AppDataSource } from '../config/database';
import { logger } from '../utils/logger';
import { ShopService } from './shop.service';
import { Shop } from '../entities/Shop';
import { UserRole, UserShop } from '../entities/UserShop';

export class UserService {
    private userRepository: Repository<User>;

    constructor() {
        this.userRepository = AppDataSource.getRepository(User);
    }

    async register(email: string, username: string, password: string): Promise<User> {
        try {
            // Create user first
            const user = this.userRepository.create({
                email,
                username,
                password
            });

            await this.userRepository.save(user);
            logger.info(`User created successfully: ${username}`);
            
            // Create default shop after user creation
            try {
                const shopService = new ShopService();
                await shopService.createDefaultShop(user);
                logger.info(`Default shop created for user: ${username}`);
            } catch (shopError) {
                logger.error(`Error creating default shop for user ${username}:`, shopError);
                // We don't throw here as user creation was successful
            }

            return user;
        } catch (error) {
            logger.error('Error in user registration:', error);
            throw error;
        }
    }

    async login(username: string, password: string): Promise<{ user: User; token: string; default_shop: Shop | null }> {
        try {
            const user = await this.userRepository.findOne({
                where: { username }
            });

            if (!user) {
                logger.warn(`Login attempt failed: User ${username} not found`);
                throw new Error('User not found');
            }

            const isValidPassword = await user.validatePassword(password);
            if (!isValidPassword) {
                logger.warn(`Login attempt failed: Invalid password for user ${username}`);
                throw new Error('Invalid password');
            }

            const token = sign({ id: user.id }, process.env.JWT_SECRET, {
               expiresIn: '1h'
            });

            // Find default shop
            const userShopRepository = AppDataSource.getRepository(UserShop);
            let defaultShop: UserShop | null = null;
            if(user.additional_data?.default_shop_id) {
                defaultShop = await userShopRepository.findOne({
                    where: { user_id: user.id, shop_id: user.additional_data?.default_shop_id },
                    relations: ['user','shop']
                });
            }
            logger.info(`User logged in successfully: ${username}`);
            return { user, token, default_shop: defaultShop?.shop || null }
        } catch (error) {
            logger.error('Error in user login:', error);
            throw error;
        }
    }

    async findById(id: string): Promise<User> {
        try {
            const user = await this.userRepository.findOne({
                where: { id }
            });
            if (!user) {
                throw new Error('User not found');
            }
            return user;
        } catch (error) {
            logger.error('Error finding user by id:', error);
            throw error;
        }
    }

    async updateUserDefaultShop(userId: string, shopId: string): Promise<User> {
        try {
            const user = await this.userRepository.findOne({
                where: { id: userId }
            });
            if (!user) {
                throw new Error('User not found');
            }
            user.additional_data = {
                ...user.additional_data,
                default_shop_id: shopId
            };
            await this.userRepository.save(user);
            return user;
        } catch (error) {
            logger.error('Error updating user default shop:', error);
            throw error;
        }
    }
}