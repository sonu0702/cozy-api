import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import html_to_pdf from 'html-pdf-node';
import { InvoiceService } from './invoice.service';
import { ApiError } from '../interfaces/ApiResponse';

export class PdfService {
    private invoiceService: InvoiceService;
    private template: HandlebarsTemplateDelegate;

    constructor() {
        this.invoiceService = new InvoiceService();
        const templatePath = path.join(__dirname, '../templates/invoice.html');
        const templateContent = fs.readFileSync(templatePath, 'utf-8');
        this.template = Handlebars.compile(templateContent);
    }

    async generateInvoicePdf(invoiceId: string, userId: string): Promise<Buffer> {
        try {
            const invoice = await this.invoiceService.getInvoiceById(invoiceId, userId);
            
            // Calculate totals
            let totalTaxableValue = 0;
            let totalCGST = 0;
            let totalSGST = 0;
            let totalIGST = 0;

            invoice.items.forEach(item => {
                totalTaxableValue += Number(item.taxableValue || 0);
                totalCGST += Number(item.cgstAmount || 0);
                totalSGST += Number(item.sgstAmount || 0);
                totalIGST += Number(item.igstAmount || 0);
            });

            // Prepare template data
            const templateData = {
                ...invoice,
                totalTaxableValue: totalTaxableValue.toFixed(2),
                totalCGST: totalCGST.toFixed(2),
                totalSGST: totalSGST.toFixed(2),
                totalIGST: totalIGST.toFixed(2),
                totalInWords: this.numberToWords(Number(invoice.total))
            };

            // Generate HTML
            const html = this.template(templateData);

            // Convert to PDF
            const options = {
                format: 'A4',
                margin: { top: 0, bottom: 0, left: 0, right: 0 },
                printBackground: true
            };

            const file = { content: html };
            const buffer = await html_to_pdf.generatePdf(file, options);
            return buffer;

        } catch (error) {
            throw new ApiError('Failed to generate PDF', 'PDF_GENERATION_ERROR');
        }
    }

    private numberToWords(n: number): string {
        const wholeNumber = Math.round(n);
        
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

        const convertGroup = (num: number): string => {
            if (num === 0) return '';
            if (num < 10) return ones[num];
            if (num < 20) return teens[num - 10];
            if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '');
            return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' ' + convertGroup(num % 100) : '');
        };

        const convertToWords = (num: number): string => {
            if (num === 0) return 'Zero';
            
            const crore = Math.floor(num / 10000000);
            const lakh = Math.floor((num % 10000000) / 100000);
            const thousand = Math.floor((num % 100000) / 1000);
            const remainder = num % 1000;
            
            let result = '';
            
            if (crore > 0) {
                result += convertGroup(crore) + ' Crore ';
            }
            if (lakh > 0) {
                result += convertGroup(lakh) + ' Lakh ';
            }
            if (thousand > 0) {
                result += convertGroup(thousand) + ' Thousand ';
            }
            if (remainder > 0) {
                result += convertGroup(remainder);
            }
            
            return result.trim() + ' Only';
        };

        return convertToWords(wholeNumber);
    }
    
}