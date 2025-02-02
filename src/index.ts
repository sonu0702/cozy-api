import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { AppDataSource } from './config/database';
import { UserController } from './controllers/user.controller';
import { authMiddleware } from './middleware/auth.middleware';
import { logger } from './utils/logger';
import { createErrorResponse, ApiError } from './interfaces/ApiResponse';
import { ShopController } from './controllers/shop.controller';
import { InvoiceController } from './controllers/invoice.controller';

config();

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors({
    origin: ['http://localhost:3000',
        'https://cozy-pi.vercel.app'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Controllers
const userController = new UserController();
const shopController = new ShopController();
const invoiceController = new InvoiceController();

// Routes
app.post('/auth/register', userController.register);
app.post('/auth/login', userController.login);
app.get('/profile', authMiddleware, userController.getProfile);

// Shop routes
app.post('/shops', authMiddleware, shopController.createShop);
app.get('/shops', authMiddleware, shopController.getShops);
app.get('/shops/:id', authMiddleware, shopController.getShop);
app.put('/shops/:id', authMiddleware, shopController.updateShop);
app.delete('/shops/:id', authMiddleware, shopController.deleteShop);
app.put('/shops/:id/default', authMiddleware, shopController.setDefaultShop);

// Invoice routes
app.post('/shops/:shopId/invoices', authMiddleware, invoiceController.createInvoice);
app.get('/shops/:shopId/invoices', authMiddleware, invoiceController.getInvoices);
app.get('/invoices/:id', authMiddleware, invoiceController.getInvoice);
app.put('/invoices/:id', authMiddleware, invoiceController.updateInvoice);
app.delete('/invoices/:id', authMiddleware, invoiceController.deleteInvoice);
app.get('/invoices/:id/pdf', authMiddleware, invoiceController.generatePdf);

// Invoice item routes
app.post('/invoices/:invoiceId/items', authMiddleware, invoiceController.addInvoiceItem);
app.put('/invoice-items/:id', authMiddleware, invoiceController.updateInvoiceItem);
app.delete('/invoice-items/:id', authMiddleware, invoiceController.deleteInvoiceItem);

// Initialize database connection
AppDataSource.initialize()
    .then(() => {
        logger.info('Database connection initialized');
        
        // Start server
        app.listen(port, () => {
            logger.info(`Server is running on port ${port}`);
        });
    })
    .catch((error) => {
        logger.error('Error during Data Source initialization:', error);
        process.exit(1);
    });

// Error handling
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Unhandled error:', error);
    const apiError = error instanceof ApiError ? error : new ApiError('Internal server error');
    res.status(500).json(createErrorResponse(apiError));
});