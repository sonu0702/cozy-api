import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Invoice } from './Invoice';

@Entity()
export class InvoiceItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    description: string;

    @Column()
    hsnSacCode: string;

    @Column('decimal', { precision: 10, scale: 2 })
    quantity: number;

    @Column('decimal', { precision: 10, scale: 2 })
    unitValue: number;

    @Column('decimal', { precision: 10, scale: 2 })
    discount: number;

    @Column('decimal', { precision: 10, scale: 2 })
    taxableValue: number;

    @Column('decimal', { precision: 5, scale: 2 })
    cgstRate: number;

    @Column('decimal', { precision: 10, scale: 2 })
    cgstAmount: number;

    @Column('decimal', { precision: 5, scale: 2 })
    sgstRate: number;

    @Column('decimal', { precision: 10, scale: 2 })
    sgstAmount: number;

    @Column('decimal', { precision: 5, scale: 2 })
    igstRate: number;

    @Column('decimal', { precision: 10, scale: 2 })
    igstAmount: number;

    @ManyToOne(() => Invoice, invoice => invoice.items)
    invoice: Invoice;
}