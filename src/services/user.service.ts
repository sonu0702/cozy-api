import { Repository } from 'typeorm';
import { sign } from 'jsonwebtoken';
import { User } from '../entities/User';
import { AppDataSource } from '../config/database';
import { logger } from '../utils/logger';
import { ShopService } from './shop.service';

export class UserService {
    private userRepository: Repository<User>;

    constructor() {
        this.userRepository = AppDataSource.getRepository(User);
    }

    async register(email: string, username: string, password: string): Promise<User> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const user = this.userRepository.create({
                email,
                username,
                password
            });

            await queryRunner.manager.save(user);
            
            // Create default shop for new user using transaction
            const shopService = new ShopService();
            await shopService.createDefaultShop(user);
            
            await queryRunner.commitTransaction();
            logger.info(`User registered successfully: ${username}`);
            return user;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            logger.error('Error in user registration:', error);
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async login(username: string, password: string): Promise<{ user: User; token: string }> {
        try {
            const user = await this.userRepository.findOne({ where: { username } });

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

            logger.info(`User logged in successfully: ${username}`);
            return { user, token };
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