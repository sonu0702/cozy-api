export const invoiceTemplate = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice</title>
    <style>
        @page {
            size: A4;
            margin: 0;
        }
        body {
            margin: 0;
            padding: 40px;
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
        }
        .container {
            max-width: 100%;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .company-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .company-address {
            font-size: 10px;
            margin-bottom: 20px;
        }
        .invoice-title {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .invoice-details {
            margin-bottom: 20px;
        }
        .invoice-details div {
            margin-bottom: 5px;
        }
        .grid-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        .box {
            border: 1px solid #000;
            padding: 10px;
        }
        .box-title {
            font-weight: bold;
            margin-bottom: 10px;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .items-table th, .items-table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: center;
        }
        .items-table th {
            background-color: #f8f8f8;
        }
        .tax-header {
            text-align: center;
        }
        .tax-columns {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
        }
        .totals {
            margin-top: 20px;
            text-align: right;
        }
        .declaration {
            margin-top: 30px;
        }
        .signature {
            margin-top: 50px;
            text-align: right;
        }
        @media print {
            .page-break {
                page-break-before: always;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="company-name">PIVORA EXPERIENTIAL COMMUNICATIONS PVT LTD</div>
            <div class="company-address">2313, 2nd Floor, Saptaghiri Padmini, 15th Main Road, 2nd Cross Hal 2nd Stage Bengaluru - 560008</div>
            <div class="invoice-title">TAX INVOICE</div>
        </div>

        <div class="invoice-details">
            <div>GSTIN: {{gstin}}</div>
            <div>Serial No. of Invoice: {{serialNo}}</div>
            <div>Date: {{date}}</div>
            <div>PAN No: {{panNo}}</div>
            <div>CIN No: {{cinNo}}</div>
            <div>State: {{state}}</div>
            <div>State Code: {{stateCode}}</div>
        </div>

        <div class="grid-container">
            <div class="box">
                <div class="box-title">Details of Receiver (Bill To)</div>
                <div>Name: {{billTo.name}}</div>
                <div>Address: {{billTo.address}}</div>
                <div>State: {{billTo.state}}</div>
                <div>State Code: {{billTo.stateCode}}</div>
                <div>GSTIN/Unique ID: {{billTo.gstin}}</div>
            </div>
            <div class="box">
                <div class="box-title">Details of Consignee (Ship To)</div>
                <div>Name: {{shipTo.name}}</div>
                <div>Address: {{shipTo.address}}</div>
                <div>State: {{shipTo.state}}</div>
                <div>State Code: {{shipTo.stateCode}}</div>
                <div>GSTIN/Unique ID: {{shipTo.gstin}}</div>
            </div>
        </div>

        <div>CUSTOMER ORDER NO: {{serialNo}} Dtd: {{date}}</div>

        <table class="items-table">
            <thead>
                <tr>
                    <th rowspan="2">Sr. No</th>
                    <th rowspan="2">Description of Service</th>
                    <th rowspan="2">HSN/SAC Code</th>
                    <th rowspan="2">Unit</th>
                    <th rowspan="2">Taxable Value</th>
                    <th colspan="2" class="tax-header">CGST</th>
                    <th colspan="2" class="tax-header">SGST</th>
                    <th colspan="2" class="tax-header">IGST</th>
                </tr>
                <tr>
                    <th>Rate</th>
                    <th>Amount</th>
                    <th>Rate</th>
                    <th>Amount</th>
                    <th>Rate</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                {{#each items}}
                <tr>
                    <td>{{@index}}</td>
                    <td>{{description}}</td>
                    <td>{{hsnSacCode}}</td>
                    <td>{{quantity}}</td>
                    <td>{{taxableValue}}</td>
                    <td>{{cgstRate}}</td>
                    <td>{{cgstAmount}}</td>
                    <td>{{sgstRate}}</td>
                    <td>{{sgstAmount}}</td>
                    <td>{{igstRate}}</td>
                    <td>{{igstAmount}}</td>
                </tr>
                {{/each}}
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="4">Total</td>
                    <td>{{totalTaxableValue}}</td>
                    <td></td>
                    <td>{{totalCGST}}</td>
                    <td></td>
                    <td>{{totalSGST}}</td>
                    <td></td>
                    <td>{{totalIGST}}</td>
                </tr>
            </tfoot>
        </table>

        <div class="totals">
            <div>Total Invoice Value (In figure): ₹{{total}}</div>
            <div>Total Invoice Value (In words): {{totalInWords}}</div>
        </div>

        <div class="declaration">
            <div><strong>Declaration:</strong></div>
            <div>Certified that the particulars given above are true and correct and checked under my supervision.</div>
        </div>

        <div class="signature">
            <div>For Pivora Experiential Communications Pvt Ltd</div>
            <div style="margin-top: 30px;">Signature of the Licence or his authorised agent</div>
        </div>
    </div>
</body>
</html>`;