import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { getRepository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';

export interface AuthRequest extends Request {
    user?: User;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ message: 'No authorization header' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = verify(token, process.env.JWT_SECRET) as { id: string };
        req.user = await  AppDataSource.getRepository(User).findOne({ where: { id: decoded.id } });

        logger.info(`User ${decoded.id} authenticated successfully`);
        next();
    } catch (error) {
        logger.error('Authentication error:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
};