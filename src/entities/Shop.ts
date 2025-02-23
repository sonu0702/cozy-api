import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { MinLength } from 'class-validator';
import { User } from './User';
import { Invoice } from './Invoice';
import { Product } from './Product';
import { UserShop } from './UserShop';

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

    @OneToMany(() => UserShop, userShop => userShop.shop)
    userShops: UserShop[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;


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