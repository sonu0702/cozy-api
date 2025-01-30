import 'reflect-metadata';
import express from 'express';
import { config } from 'dotenv';
import { AppDataSource } from './config/database';
import { UserController } from './controllers/user.controller';
import { authMiddleware } from './middleware/auth.middleware';
import { logger } from './utils/logger';
import { ShopController } from './controllers/shop.controller';
import { InvoiceController } from './controllers/invoice.controller';

config();

const app = express();
const port = process.env.PORT || 8080;

// Middleware
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
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({ message: 'Internal server error' });
});