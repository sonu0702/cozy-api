import { Entity, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, PrimaryColumn, JoinColumn } from 'typeorm';
import { User } from './User';
import { Shop } from './Shop';

export enum UserRole {
    OWNER = 'OWNER',
    EDITOR = 'EDITOR',
    VIEWER = 'VIEWER'
}

@Entity('user_shops')
export class UserShop {
    @PrimaryColumn()
    user_id: string;

    @PrimaryColumn()
    shop_id: string;

    @ManyToOne(() => User, user => user.userShops)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Shop, shop => shop.userShops)
    @JoinColumn({ name: 'shop_id' })
    shop: Shop;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.VIEWER
    })
    role: UserRole;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}