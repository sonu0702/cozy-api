import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { logger } from '../utils/logger';

export class UserController {
    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    register = async (req: Request, res: Response): Promise<void> => {
        try {
            const { email, username, password } = req.body;

            if (!email || !username || !password) {
                res.status(400).json({ message: 'Missing required fields' });
                return;
            }

            const user = await this.userService.register(email, username, password);
            res.status(201).json({
                message: 'User registered successfully',
                user: { id: user.id, email: user.email, username: user.username }
            });
        } catch (error) {
            logger.error('Registration error:', error);
            res.status(500).json({ message: 'Error registering user' });
        }
    };

    login = async (req: Request, res: Response): Promise<void> => {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                res.status(400).json({ message: 'Missing credentials' });
                return;
            }

            const { user, token } = await this.userService.login(username, password);
            res.status(200).json({
                message: 'Login successful',
                user: { id: user.id, email: user.email, username: user.username },
                token
            });
        } catch (error) {
            logger.error('Login error:', error);
            res.status(401).json({ message: 'Invalid credentials' });
        }
    };

    getProfile = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = (req as any).user.id;
            const user = await this.userService.findById(userId);
            
            res.status(200).json({
                user: { 
                    id: user.id, 
                    email: user.email, 
                    username: user.username,
                    shops: user.shops
                }
            });
        } catch (error) {
            logger.error('Error fetching user profile:', error);
            res.status(500).json({ message: 'Error fetching user profile' });
        }
    };
}