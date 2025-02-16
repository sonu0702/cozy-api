import { Repository } from 'typeorm';
import { Invoice } from '../entities/Invoice';
import { Product } from '../entities/Product';
import { AppDataSource } from '../config/database';
import { logger } from '../utils/logger';
import { ApiError } from '../interfaces/ApiResponse';
import { InvoiceType } from '../enums/InvoiceType';

export class AnalyticsService {
    private invoiceRepository: Repository<Invoice>;
    private productRepository: Repository<Product>;

    constructor() {
        this.invoiceRepository = AppDataSource.getRepository(Invoice);
        this.productRepository = AppDataSource.getRepository(Product);
    }

    async getTodaySales(shopId: string): Promise<number> {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const result = await this.invoiceRepository
                .createQueryBuilder('invoice')
                .select('SUM(invoice.total)', 'total')
                .where('invoice.shop.id = :shopId', { shopId })
                .andWhere('invoice.created_at >= :today', { today })
                .andWhere('invoice.type = :type', { type: InvoiceType.INVOICE })
                .getRawOne();

            return result?.total || 0;
        } catch (error) {
            logger.error('Error calculating today\'s sales:', error);
            throw new ApiError('Failed to calculate today\'s sales', 'ANALYTICS_ERROR');
        }
    }

    async getYearlySales(shopId: string): Promise<number> {
        try {
            const startOfYear = new Date(new Date().getFullYear(), 0, 1);

            const result = await this.invoiceRepository
                .createQueryBuilder('invoice')
                .select('SUM(invoice.total)', 'total')
                .where('invoice.shop.id = :shopId', { shopId })
                .andWhere('invoice.created_at >= :startOfYear', { startOfYear })
                .andWhere('invoice.type = :type', { type: InvoiceType.INVOICE })
                .getRawOne();

            return result?.total || 0;
        } catch (error) {
            logger.error('Error calculating yearly sales:', error);
            throw new ApiError('Failed to calculate yearly sales', 'ANALYTICS_ERROR');
        }
    }

    async getProductCount(shopId: string): Promise<number> {
        try {
            return await this.productRepository.count({
                where: { shop: { id: shopId } }
            });
        } catch (error) {
            logger.error('Error counting products:', error);
            throw new ApiError('Failed to count products', 'ANALYTICS_ERROR');
        }
    }

    async getMonthSales(shopId: string, year?: number, month?: number): Promise<number> {
        try {
            const targetYear = year || new Date().getFullYear();
            const targetMonth = month || new Date().getMonth() + 1;

            const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
            const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

            const result = await this.invoiceRepository
                .createQueryBuilder('invoice')
                .select('SUM(invoice.total)', 'total')
                .where('invoice.shop.id = :shopId', { shopId })
                .andWhere('invoice.created_at >= :startOfMonth', { startOfMonth })
                .andWhere('invoice.created_at <= :endOfMonth', { endOfMonth })
                .andWhere('invoice.type = :type', { type: InvoiceType.INVOICE })
                .getRawOne();

            return result?.total || 0;
        } catch (error) {
            logger.error('Error calculating monthly sales:', error);
            throw new ApiError('Failed to calculate monthly sales', 'ANALYTICS_ERROR');
        }
    }
}