import { Repository } from 'typeorm';
import { sign } from 'jsonwebtoken';
import { User } from '../entities/User';
import { AppDataSource } from '../config/database';
import { logger } from '../utils/logger';
import { ShopService } from './shop.service';
import { Shop } from '../entities/Shop';

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
                where: { username },
                relations: ['shops']
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
            const shopRepository = AppDataSource.getRepository(Shop);
            const defaultShop = await shopRepository.findOne({
                where: { owned_by: { id: user.id }, is_default: true },
                relations: ['owned_by']
            });

            logger.info(`User logged in successfully: ${username}`);
            return { user, token, default_shop: defaultShop }
        } catch (error) {
            logger.error('Error in user login:', error);
            throw error;
        }
    }

    async findById(id: string): Promise<User> {
        try {
            const user = await this.userRepository.findOne({
                where: { id },
                relations: ['shops']
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
}