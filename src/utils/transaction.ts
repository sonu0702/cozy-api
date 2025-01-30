import { QueryRunner } from 'typeorm';
import { AppDataSource } from '../config/database';
import { logger } from './logger';

type TransactionCallback<T> = (queryRunner: QueryRunner) => Promise<T>;

export async function withTransaction<T>(
    callback: TransactionCallback<T>,
    errorMessage: string = 'Transaction failed'
): Promise<T> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        const result = await callback(queryRunner);
        await queryRunner.commitTransaction();
        return result;
    } catch (error) {
        await queryRunner.rollbackTransaction();
        logger.error(`${errorMessage}:`, error);
        throw error;
    } finally {
        await queryRunner.release();
    }
}