import { Response } from 'express';
import { InvoiceService } from '../services/invoice.service';
import { createSuccessResponse, createErrorResponse, ApiError } from '../interfaces/ApiResponse';
import { AuthRequest } from '../middleware/auth.middleware';
import { PdfService } from '../services/pdf.service';

export class InvoiceController {
    private invoiceService: InvoiceService;
    private pdfService: PdfService;

    constructor() {
        this.invoiceService = new InvoiceService();
        this.pdfService = new PdfService();
    }

    createInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { shopId, items, ...invoiceData } = req.body;
            const invoice = await this.invoiceService.createInvoice(invoiceData, items, req.user, shopId);
            res.status(201).json(createSuccessResponse(invoice, 'Invoice created successfully'));
        } catch (error) {
            const apiError = error instanceof ApiError ? error : new ApiError('Failed to create invoice');
            res.status(400).json(createErrorResponse(apiError));
        }
    };

    getInvoices = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { shopId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const { invoices, total } = await this.invoiceService.getInvoicesByShop(shopId, req.user.id, page, limit);
            res.json(createSuccessResponse({
                invoices,
                pagination: {
                    total,
                    page,
                    limit,
                    total_pages: Math.ceil(total / limit)
                }
            }, 'Invoices retrieved successfully'));
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

    addInvoiceItem = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { invoiceId } = req.params;
            const item = await this.invoiceService.addInvoiceItem(invoiceId, req.body, req.user.id);
            res.status(201).json(createSuccessResponse(item, 'Invoice item added successfully'));
        } catch (error) {
            const apiError = error instanceof ApiError ? error : new ApiError('Failed to add invoice item');
            res.status(error instanceof ApiError && error.code === 'INVOICE_NOT_FOUND' ? 404 : 400)
                .json(createErrorResponse(apiError));
        }
    };

    updateInvoiceItem = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const item = await this.invoiceService.updateInvoiceItem(id, req.body, req.user.id);
            res.json(createSuccessResponse(item, 'Invoice item updated successfully'));
        } catch (error) {
            const apiError = error instanceof ApiError ? error : new ApiError('Failed to update invoice item');
            res.status(error instanceof ApiError && error.code === 'INVOICE_ITEM_NOT_FOUND' ? 404 : 400)
                .json(createErrorResponse(apiError));
        }
    };

    deleteInvoiceItem = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            await this.invoiceService.deleteInvoiceItem(id, req.user.id);
            res.json(createSuccessResponse(null, 'Invoice item deleted successfully'));
        } catch (error) {
            const apiError = error instanceof ApiError ? error : new ApiError('Failed to delete invoice item');
            res.status(error instanceof ApiError && error.code === 'INVOICE_ITEM_NOT_FOUND' ? 404 : 400)
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

    searchBillTo = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { name } = req.query;
            const {shop_id} = req.params;
            if (!name || typeof name !== 'string') {
                throw new ApiError('Name parameter is required', 'INVALID_PARAMETER');
            }
            const billToResults = await this.invoiceService.searchBillTo(name, shop_id);
            res.json(createSuccessResponse(billToResults, 'BillTo search completed successfully'));
        } catch (error) {
            const apiError = error instanceof ApiError ? error : new ApiError('Failed to search billTo');
            res.status(400).json(createErrorResponse(apiError));
        }
    };

    searchShipTo = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { name } = req.query;
            const {shop_id} = req.params;
            if (!name || typeof name !== 'string') {
                throw new ApiError('Name parameter is required', 'INVALID_PARAMETER');
            }
            const shipToResults = await this.invoiceService.searchShipTo(name, shop_id);
            res.json(createSuccessResponse(shipToResults, 'ShipTo search completed successfully'));
        } catch (error) {
            const apiError = error instanceof ApiError ? error : new ApiError('Failed to search shipTo');
            res.status(400).json(createErrorResponse(apiError));
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

    generatePdf = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const pdfBuffer = await this.pdfService.generateInvoicePdf(id, req.user.id);
            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=invoice-${id}.pdf`);
            res.send(pdfBuffer);
        } catch (error) {
            const apiError = error instanceof ApiError ? error : new ApiError('Failed to generate PDF');
            res.status(400).json(createErrorResponse(apiError));
        }
    };
}