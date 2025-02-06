import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { MinLength } from 'class-validator';
import { Shop } from './Shop';

@Entity('products')
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @MinLength(2)
    name: string;

    @Column('decimal', { precision: 10, scale: 2 })
    price: number;

    @Column()
    hsn: string;

    @Column()
    category: string;

    @Column('decimal', { precision: 5, scale: 2 })
    cgst: number;

    @Column('decimal', { precision: 5, scale: 2 })
    sgst: number;

    @Column('decimal', { precision: 5, scale: 2 })
    igst: number;

    @ManyToOne(() => Shop, shop => shop.products)
    @JoinColumn({ name: 'shop_id' })
    shop: Shop;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}