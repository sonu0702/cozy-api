import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';
import { Shop } from './Shop';
import { InvoiceItem } from './InvoiceItem';

@Entity()
export class Invoice {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    gstin: string;

    @Column()
    address: string;

    @Column()
    serialNo: string;

    @Column()
    date: string;

    @Column()
    panNo: string;

    @Column()
    cinNo: string;

    @Column()
    state: string;

    @Column()
    stateCode: string;

    @Column({nullable:true})
    shop_legal_name: string;

    @Column('jsonb')
    billTo: {
        name: string;
        address: string;
        state: string;
        stateCode: string;
        gstin: string;
    };

    @Column('jsonb')
    shipTo: {
        name: string;
        address: string;
        state: string;
        stateCode: string;
        gstin: string;
    };

    @Column('jsonb', { nullable: true})
    bank_detail: {
        bank_name: string;
        account_number: string;
        IFSC_code: string;
        account_holder_name: string;
    };

    @Column('decimal', { precision: 10, scale: 2 })
    total: number;

    @Column('jsonb', { nullable: true })
    additional_data: any;

    @ManyToOne(() => Shop, shop => shop.invoices)
    shop: Shop;

    @ManyToOne(() => User, user => user.created_invoices)
    created_by: User;

    @OneToMany(() => InvoiceItem, item => item.invoice, { cascade: true })
    items: InvoiceItem[];

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}