import { Repository, Like } from 'typeorm';
import { Product } from '../entities/Product';
import { AppDataSource } from '../config/database';
import { logger } from '../utils/logger';
import { ApiError } from '../interfaces/ApiResponse';
import { Shop } from '../entities/Shop';

export class ProductService {
    private productRepository: Repository<Product>;
    private shopRepository: Repository<Shop>;

    constructor() {
        this.productRepository = AppDataSource.getRepository(Product);
        this.shopRepository = AppDataSource.getRepository(Shop);
    }

    async createProduct(productData: Partial<Product>, shopId: string): Promise<Product> {
        try {
            const shop = await this.shopRepository.findOne({ where: { id: shopId } });
            if (!shop) {
                throw new ApiError('Shop not found', 'SHOP_NOT_FOUND');
            }

            const product = this.productRepository.create({
                ...productData,
                shop
            });

            await this.productRepository.save(product);
            logger.info(`Product created successfully: ${product.name}`);
            return product;
        } catch (error) {
            logger.error('Error in product creation:', error);
            throw error;
        }
    }

    private validateAndTransformProductData(productData: Partial<Product>): Partial<Product> {
        const transformedData: Partial<Product> = {};

        // Name validation and transformation
        if (productData.name !== undefined) {
            transformedData.name = String(productData.name).trim();
            if (transformedData.name.length < 2) {
                throw new ApiError('Product name must be at least 2 characters long', 'VALIDATION_ERROR');
            }
        }

        // Price validation and transformation
        if (productData.price !== undefined) {
            const price = Number(productData.price);
            if (isNaN(price) || price < 0) {
                throw new ApiError('Invalid price value', 'VALIDATION_ERROR');
            }
            transformedData.price = Number(price.toFixed(2));
        } else {
            transformedData.price = 0;
        }

        // HSN validation and transformation
        if (productData.hsn !== undefined) {
            transformedData.hsn = String(productData.hsn).trim();
        } else {
            transformedData.hsn = '';
        }

        // Category validation and transformation
        if (productData.category !== undefined) {
            transformedData.category = String(productData.category).trim();
        } else {
            transformedData.category = 'General';
        }

        // Tax rates validation and transformation
        ['cgst', 'sgst', 'igst'].forEach(taxType => {
            if (productData[taxType] !== undefined) {
                const taxRate = Number(productData[taxType]);
                if (isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
                    throw new ApiError(`Invalid ${taxType.toUpperCase()} rate`, 'VALIDATION_ERROR');
                }
                transformedData[taxType] = Number(taxRate.toFixed(2));
            } else {
                transformedData[taxType] = 0;
            }
        });

        if (productData.discount_percent !== undefined) {
            const discount_percent = Number(productData.discount_percent);
            if (isNaN(discount_percent) || discount_percent < 0) {
                throw new ApiError('Invalid discount_percent value', 'VALIDATION_ERROR');
            }
            transformedData.discount_percent = Number(discount_percent.toFixed(2));
        } else {
            transformedData.discount_percent = 0;
        }

        return transformedData;
    }

    async bulkCreateProducts(productsData: Partial<Product>[], shopId: string): Promise<Product[]> {
        try {
            const shop = await this.shopRepository.findOne({ where: { id: shopId } });
            if (!shop) {
                throw new ApiError('Shop not found', 'SHOP_NOT_FOUND');
            }

            const batchSize = 1000; // Process 1000 products at a time
            const createdProducts: Product[] = [];

            // Process products in batches
            for (let i = 0; i < productsData.length; i += batchSize) {
                const batch = productsData.slice(i, i + batchSize);
                const products = batch.map(productData => {
                    const validatedData = this.validateAndTransformProductData(productData);
                    return this.productRepository.create({
                        ...validatedData,
                        shop
                    });
                });

                // Save batch in a transaction
                const savedProducts = await AppDataSource.transaction(async transactionalEntityManager => {
                    return await transactionalEntityManager.save(products);
                });

                createdProducts.push(...savedProducts);
                logger.info(`Batch of ${savedProducts.length} products created successfully`);
            }

            return createdProducts;
        } catch (error) {
            logger.error('Error in bulk product creation:', error);
            throw error;
        }
    }

    async getProducts(shopId: string): Promise<Product[]> {
        try {
            const products = await this.productRepository.find({
                where: { shop: { id: shopId } },
                relations: ['shop']
            });

            // Transform numeric fields
            return products.map(product => ({
                ...product,
                cgst: Number(product.cgst),
                sgst: Number(product.sgst),
                igst: Number(product.igst),
                price: Number(product.price),
                discount_percent: Number(product.discount_percent)
            }));
        } catch (error) {
            logger.error('Error fetching products:', error);
            throw error;
        }
    }

    async getProductById(id: string): Promise<Product> {
        try {
            const product = await this.productRepository.findOne({
                where: { id },
                relations: ['shop']
            });

            if (!product) {
                throw new ApiError('Product not found', 'PRODUCT_NOT_FOUND');
            }

            return product;
        } catch (error) {
            logger.error('Error fetching product:', error);
            throw error;
        }
    }

    async updateProduct(id: string, productData: Partial<Product>): Promise<Product> {
        try {
            const product = await this.getProductById(id);
            Object.assign(product, productData);
            await this.productRepository.save(product);
            logger.info(`Product updated successfully: ${product.name}`);
            return product;
        } catch (error) {
            logger.error('Error updating product:', error);
            throw error;
        }
    }

    async deleteProduct(id: string): Promise<void> {
        try {
            const product = await this.getProductById(id);
            await this.productRepository.remove(product);
            logger.info(`Product deleted successfully: ${product.name}`);
        } catch (error) {
            logger.error('Error deleting product:', error);
            throw error;
        }
    }

    async searchProducts(shopId: string, query: string): Promise<Product[]> {
        try {
            const products = await this.productRepository
                .createQueryBuilder('product')
                .where(`product.shop_id = :shopId`, { shopId })
                .andWhere('LOWER(product.name) LIKE LOWER(:query)', { query: `%${query}%` })
                .getMany();

            // Transform numeric fields
            return products.map(product => ({
                ...product,
                cgst: Number(product.cgst),
                sgst: Number(product.sgst),
                igst: Number(product.igst),
                price: Number(product.price),
                discount_percent: Number(product.discount_percent)
            }));
        } catch (error) {
            logger.error('Error searching products:', error);
            throw error;
        }
    }
}