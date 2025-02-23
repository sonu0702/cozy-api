import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BeforeInsert, OneToMany } from 'typeorm';
import { IsEmail, MinLength } from 'class-validator';
import * as bcrypt from 'bcrypt';
import { Invoice } from './Invoice';
import { UserShop } from './UserShop';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true, nullable: true })
    email?: string;

    @Column({ unique: true })
    @MinLength(4)
    username: string;

    @Column()
    @MinLength(6)
    password: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => UserShop, userShop => userShop.user)
    userShops: UserShop[];

    @OneToMany(() => Invoice, invoice => invoice.created_by)
    created_invoices: Invoice[];

    @Column('jsonb', { nullable: true})
    additional_data: {
        default_shop_id: string;
    };

    @BeforeInsert()
    async hashPassword() {
        const salt = await bcrypt.genSalt();
        this.password = await bcrypt.hash(this.password, salt);
    }

    async validatePassword(password: string): Promise<boolean> {
        return bcrypt.compare(password, this.password);
    }
}