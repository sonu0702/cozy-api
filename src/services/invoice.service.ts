import { Repository } from 'typeorm';
import { Invoice } from '../entities/Invoice';
import { User } from '../entities/User';
import { Shop } from '../entities/Shop';
import { AppDataSource } from '../config/database';
import { logger } from '../utils/logger';
import { ApiError } from '../interfaces/ApiResponse';
import { withTransaction } from '../utils/transaction';
import { InvoiceItem } from '../entities/InvoiceItem';

export class InvoiceService {
    private invoiceRepository: Repository<Invoice>;

    constructor() {
        this.invoiceRepository = AppDataSource.getRepository(Invoice);
    }

    async createInvoice(invoiceData: Partial<Invoice>, items: Partial<InvoiceItem>[], user: User, shopId: string): Promise<Invoice> {
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

            if (items && items.length > 0) {
                const invoiceItems = items.map(item => {
                    return queryRunner.manager.create(InvoiceItem, {
                        ...item,
                        invoice: invoice
                    });
                });
                await queryRunner.manager.save(invoiceItems);
                invoice.items = invoiceItems;
            }

            logger.info(`Invoice created successfully for shop: ${shop.name}`);
            return invoice;
        }, 'Error in invoice creation');
    }

    async getInvoicesByShop(shopId: string, userId: string, page: number = 1, limit: number = 10, type?: string): Promise<{ invoices: Invoice[], total: number }> {
        try {
            const skip = (page - 1) * limit;
            const queryBuilder = this.invoiceRepository.createQueryBuilder('invoice')
                .leftJoinAndSelect('invoice.items', 'items')
                .leftJoinAndSelect('invoice.shop', 'shop')
                .leftJoinAndSelect('invoice.created_by', 'created_by')
                .where('shop.id = :shopId', { shopId });

            if (type) {
                queryBuilder.andWhere('invoice.type = :type', { type });
            }

            const [invoices, total] = await queryBuilder
                .orderBy('invoice.created_at', 'DESC')
                .take(limit)
                .skip(skip)
                .getManyAndCount();

            return { invoices, total };
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
            
            // Handle invoice items if present
            if (invoiceData.items) {
                const items = invoiceData.items;
                delete invoiceData.items; // Remove items from main invoice data
                
                // Update existing items and create new ones
                const updatedItems = await Promise.all(items.map(async (item) => {
                    if (item.id) {
                        // Update existing item
                        const existingItem = await queryRunner.manager.findOne(InvoiceItem, {
                            where: { id: item.id, invoice: { id: invoice.id } },
                            relations: ['invoice']
                        });
                        if (existingItem) {
                            Object.assign(existingItem, item);
                            return queryRunner.manager.save(existingItem);
                        }
                    }
                    // Create new item with invoice association
                    const newItem = queryRunner.manager.create(InvoiceItem, {
                        ...item,
                        invoice: invoice
                    });
                    return queryRunner.manager.save(newItem);
                }));
                
                invoice.items = updatedItems;
            }
            
            // Update main invoice data
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

    async addInvoiceItem(invoiceId: string, itemData: Partial<InvoiceItem>, userId: string): Promise<InvoiceItem> {
        return withTransaction(async (queryRunner) => {
            const invoice = await this.getInvoiceById(invoiceId, userId);
            const item = queryRunner.manager.create(InvoiceItem, {
                ...itemData,
                invoice: invoice
            });
            await queryRunner.manager.save(item);
            return item;
        }, 'Error adding invoice item');
    }

    async updateInvoiceItem(id: string, itemData: Partial<InvoiceItem>, userId: string): Promise<InvoiceItem> {
        return withTransaction(async (queryRunner) => {
            const item = await queryRunner.manager.findOne(InvoiceItem, {
                where: { id, invoice: { shop: { owned_by: { id: userId } } } },
                relations: ['invoice', 'invoice.shop', 'invoice.shop.owned_by']
            });

            if (!item) {
                throw new ApiError('Invoice item not found', 'INVOICE_ITEM_NOT_FOUND');
            }

            Object.assign(item, itemData);
            await queryRunner.manager.save(item);
            return item;
        }, 'Error updating invoice item');
    }

    async deleteInvoiceItem(id: string, userId: string): Promise<void> {
        return withTransaction(async (queryRunner) => {
            const item = await queryRunner.manager.findOne(InvoiceItem, {
                where: { id, invoice: { shop: { owned_by: { id: userId } } } },
                relations: ['invoice', 'invoice.shop', 'invoice.shop.owned_by']
            });

            if (!item) {
                throw new ApiError('Invoice item not found', 'INVOICE_ITEM_NOT_FOUND');
            }

            await queryRunner.manager.remove(item);
        }, 'Error deleting invoice item');
    }

    async searchBillTo(name: string, shop_id: string): Promise<{ name: string; address: string; state: string; stateCode: string; gstin: string; }[]> {
        try {
            const result = await this.invoiceRepository
                .createQueryBuilder('invoice')
                .select(`DISTINCT invoice."billTo"`)
                .where('invoice.shop.id = :shop_id', { shop_id })
                .andWhere(`LOWER(invoice."billTo"::jsonb->>\'name\') LIKE :name`, { name: `%${name.toLowerCase()}%` })
                .getRawMany();

            return result.map(row => row.billTo);
        } catch (error) {
            logger.error('Error searching billTo:', error);
            throw new ApiError('Failed to search billTo', 'SEARCH_ERROR');
        }
    }

    async searchShipTo(name: string, shop_id: string): Promise<{ name: string; address: string; state: string; stateCode: string; gstin: string; }[]> {
        try {
            const result = await this.invoiceRepository
                .createQueryBuilder('invoice')
                .select(`DISTINCT invoice."shipTo"`)
                .where('invoice.shop.id = :shop_id', { shop_id })
                .andWhere(`LOWER(invoice."shipTo"::jsonb->>\'name\') LIKE :name`, { name: `%${name.toLowerCase()}%` })
                .getRawMany();

            return result.map(row => row.shipTo);
        } catch (error) {
            logger.error('Error searching shipTo:', error);
            throw new ApiError('Failed to search shipTo', 'SEARCH_ERROR');
        }
    }
}