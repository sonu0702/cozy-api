import { Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { createSuccessResponse, createErrorResponse, ApiError } from '../interfaces/ApiResponse';
import { AuthRequest } from '../middleware/auth.middleware';

export class AnalyticsController {
    private analyticsService: AnalyticsService;

    constructor() {
        this.analyticsService = new AnalyticsService();
    }

    getTodaySales = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { shopId } = req.params;
            const total = await this.analyticsService.getTodaySales(shopId);
            res.json(createSuccessResponse({ total: total.toString() }, 'Today\'s sales retrieved successfully'));
        } catch (error) {
            const apiError = error instanceof ApiError ? error : new ApiError('Failed to fetch today\'s sales');
            res.status(400).json(createErrorResponse(apiError));
        }
    };

    getYearlySales = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { shopId } = req.params;
            const total = await this.analyticsService.getYearlySales(shopId);
            res.json(createSuccessResponse({ total: total.toString() }, 'Yearly sales retrieved successfully'));
        } catch (error) {
            const apiError = error instanceof ApiError ? error : new ApiError('Failed to fetch yearly sales');
            res.status(400).json(createErrorResponse(apiError));
        }
    };

    getMonthSales = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { shopId } = req.params;
            const { year, month } = req.query;
            const total = await this.analyticsService.getMonthSales(
                shopId,
                year ? parseInt(year as string) : undefined,
                month ? parseInt(month as string) : undefined
            );
            res.json(createSuccessResponse({ total: total.toString() }, 'Monthly sales retrieved successfully'));
        } catch (error) {
            const apiError = error instanceof ApiError ? error : new ApiError('Failed to fetch monthly sales');
            res.status(400).json(createErrorResponse(apiError));
        }
    };

    getProductCount = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { shopId } = req.params;
            const count = await this.analyticsService.getProductCount(shopId);
            res.json(createSuccessResponse({ count: count.toString() }, 'Product count retrieved successfully'));
        } catch (error) {
            const apiError = error instanceof ApiError ? error : new ApiError('Failed to fetch product count');
            res.status(400).json(createErrorResponse(apiError));
        }
    };

    getNetIncome = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { shopId } = req.params;
            const total = await this.analyticsService.getMonthSales(shopId);
            res.json(createSuccessResponse({ total: total.toString() }, 'Net income retrieved successfully'));
        } catch (error) {
            const apiError = error instanceof ApiError ? error : new ApiError('Failed to fetch net income');
            res.status(400).json(createErrorResponse(apiError));
        }
    };
}