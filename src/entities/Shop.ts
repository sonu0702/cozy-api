import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { MinLength } from 'class-validator';
import { User } from './User';
import { Invoice } from './Invoice';
import { Product } from './Product';

@Entity('shops')
export class Shop {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @MinLength(2)
    name: string;

    @Column({nullable:true})
    legal_name: string;

    @Column({nullable:true})
    digital_signature: string;

    @Column({ nullable: true })
    gstin: string;

    @Column({ nullable: true })
    pan: string;

    @Column({ nullable: true})
    @MinLength(5)
    address: string;

    @Column({ nullable: true })
    cin: string;

    @Column({ nullable: true})
    @MinLength(2)
    state: string;

    @Column({ nullable: true})
    state_code: string;

    @Column({ nullable: true})
    @MinLength(6)
    pin: string;

    @ManyToOne(() => User, user => user.shops)
    @JoinColumn({ name: 'owned_by_id' })
    owned_by: User;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ default: false })
    is_default: boolean;

    @OneToMany(() => Invoice, invoice => invoice.shop)
    invoices: Invoice[];

    @OneToMany(() => Product, product => product.shop)
    products: Product[];

    @Column('jsonb', { nullable: true})
    bank_detail: {
        bank_name: string;
        account_number: string;
        IFSC_code: string;
        account_holder_name: string;
    };
}