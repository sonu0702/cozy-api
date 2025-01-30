import { Repository } from 'typeorm';
import { Invoice } from '../entities/Invoice';
import { User } from '../entities/User';
import { Shop } from '../entities/Shop';
import { AppDataSource } from '../config/database';
import { logger } from '../utils/logger';
import { ApiError } from '../interfaces/ApiResponse';
import { withTransaction } from '../utils/transaction';

export class InvoiceService {
    private invoiceRepository: Repository<Invoice>;

    constructor() {
        this.invoiceRepository = AppDataSource.getRepository(Invoice);
    }

    async createInvoice(invoiceData: Partial<Invoice>, user: User, shopId: string): Promise<Invoice> {
        return withTransaction(async (queryRunner) => {
            const shop = await queryRunner.manager.findOne(Shop, { where: { id: shopId, owned_by: { id: user.id } } });
            if (!shop) {
                throw new ApiError('Shop not found or unauthorized', 'SHOP_NOT_FOUND');
            }

            const invoice = this.invoiceRepository.create({
                ...invoiceData,
                created_by: user,
                shop: shop
            });

            await queryRunner.manager.save(invoice);
            logger.info(`Invoice created successfully for shop: ${shop.name}`);
            return invoice;
        }, 'Error in invoice creation');
    }

    async getInvoicesByShop(shopId: string, userId: string): Promise<Invoice[]> {
        try {
            return await this.invoiceRepository.find({
                where: { 
                    shop: { id: shopId }
                },
                relations: ['items', 'shop', 'created_by'],
                order: { created_at: 'DESC' }
            });
        } catch (error) {
            logger.error('Error fetching invoices:', error);
            throw new ApiError('Failed to fetch invoices', 'INVOICE_FETCH_ERROR');
        }
    }

    async getInvoiceById(id: string, userId: string): Promise<Invoice> {
        try {
            const invoice = await this.invoiceRepository.findOne({
                where: { 
                    id,
                    shop: { owned_by: { id: userId } }
                },
                relations: ['items', 'shop', 'created_by']
            });

            if (!invoice) {
                throw new ApiError('Invoice not found', 'INVOICE_NOT_FOUND');
            }

            return invoice;
        } catch (error) {
            if (error instanceof ApiError) throw error;
            logger.error('Error fetching invoice:', error);
            throw new ApiError('Failed to fetch invoice', 'INVOICE_FETCH_ERROR');
        }
    }

    async updateInvoice(id: string, userId: string, invoiceData: Partial<Invoice>): Promise<Invoice> {
        return withTransaction(async (queryRunner) => {
            const invoice = await this.getInvoiceById(id, userId);
            Object.assign(invoice, invoiceData);
            await queryRunner.manager.save(invoice);
            return invoice;
        }, 'Error updating invoice');
    }

    async deleteInvoice(id: string, userId: string): Promise<void> {
        return withTransaction(async (queryRunner) => {
            const invoice = await this.getInvoiceById(id, userId);
            await queryRunner.manager.remove(invoice);
        }, 'Error deleting invoice');
    }
}