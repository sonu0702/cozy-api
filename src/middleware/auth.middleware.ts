import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { getRepository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { createErrorResponse, ApiError } from '../interfaces/ApiResponse';

export interface AuthRequest extends Request {
    user?: User;
    body: any;
    params: any;
    query: any;
    headers: any;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            throw new ApiError('No authorization header', 'AUTHENTICATION_ERROR');
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            throw new ApiError('No token provided', 'AUTHENTICATION_ERROR');
        }

        const decoded = verify(token, process.env.JWT_SECRET) as { id: string };
        req.user = await  AppDataSource.getRepository(User).findOne({ where: { id: decoded.id } });

        logger.info(`User ${decoded.id} authenticated successfully`);
        next();
    } catch (error) {
        logger.error('Authentication error:', error);
        const apiError = error instanceof ApiError ? error : new ApiError('Invalid token', 'AUTHENTICATION_ERROR');
        return res.status(401).json(createErrorResponse(apiError));
    }
};