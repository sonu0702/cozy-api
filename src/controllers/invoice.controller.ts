import { Response } from 'express';
import { InvoiceService } from '../services/invoice.service';
import { createSuccessResponse, createErrorResponse, ApiError } from '../interfaces/ApiResponse';
import { AuthRequest } from '../middleware/auth.middleware';

export class InvoiceController {
    private invoiceService: InvoiceService;

    constructor() {
        this.invoiceService = new InvoiceService();
    }

    createInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { shopId, ...invoiceData } = req.body;
            const invoice = await this.invoiceService.createInvoice(invoiceData, req.user, shopId);
            res.status(201).json(createSuccessResponse(invoice, 'Invoice created successfully'));
        } catch (error) {
            const apiError = error instanceof ApiError ? error : new ApiError('Failed to create invoice');
            res.status(400).json(createErrorResponse(apiError));
        }
    };

    getInvoices = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { shopId } = req.params;
            const invoices = await this.invoiceService.getInvoicesByShop(shopId, req.user.id);
            res.json(createSuccessResponse(invoices, 'Invoices retrieved successfully'));
        } catch (error) {
            const apiError = error instanceof ApiError ? error : new ApiError('Failed to fetch invoices');
            res.status(400).json(createErrorResponse(apiError));
        }
    };

    getInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const invoice = await this.invoiceService.getInvoiceById(req.params.id, req.user.id);
            res.json(createSuccessResponse(invoice, 'Invoice retrieved successfully'));
        } catch (error) {
            const apiError = error instanceof ApiError ? error : new ApiError('Failed to fetch invoice');
            res.status(error instanceof ApiError && error.code === 'INVOICE_NOT_FOUND' ? 404 : 400)
                .json(createErrorResponse(apiError));
        }
    };

    updateInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const invoice = await this.invoiceService.updateInvoice(req.params.id, req.user.id, req.body);
            res.json(createSuccessResponse(invoice, 'Invoice updated successfully'));
        } catch (error) {
            const apiError = error instanceof ApiError ? error : new ApiError('Failed to update invoice');
            res.status(error instanceof ApiError && error.code === 'INVOICE_NOT_FOUND' ? 404 : 400)
                .json(createErrorResponse(apiError));
        }
    };

    deleteInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            await this.invoiceService.deleteInvoice(req.params.id, req.user.id);
            res.json(createSuccessResponse(null, 'Invoice deleted successfully'));
        } catch (error) {
            const apiError = error instanceof ApiError ? error : new ApiError('Failed to delete invoice');
            res.status(error instanceof ApiError && error.code === 'INVOICE_NOT_FOUND' ? 404 : 400)
                .json(createErrorResponse(apiError));
        }
    };
}