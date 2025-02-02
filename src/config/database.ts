import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

export const AppDataSource = new DataSource({
    type: 'postgres',
    // host: process.env.DB_HOST,
    // port: parseInt(process.env.DB_PORT || '5432'),
    // username: process.env.DB_USERNAME,
    // password: process.env.DB_PASSWORD,
    // database: process.env.DB_DATABASE,
    url: process.env.DATABASE_URL,
    ssl:true,
    synchronize: process.env.NODE_ENV === 'development',
    logging: process.env.NODE_ENV === 'development',
    entities: [__dirname + '/../entities/*.{js,ts}'],
    migrations: [__dirname + '/../migrations/*.{js,ts}'],
    subscribers: [__dirname + '/../subscribers/*.{js,ts}'],
});