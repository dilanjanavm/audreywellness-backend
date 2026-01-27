import { registerAs } from '@nestjs/config';
export default registerAs(
  'database',
  (): {
    type: string;
    host: any;
    port: number;
    username: any;
    password: any;
    database: any;
    entities: string[];
    seeds: string[];
    synchronize: boolean;
  } => ({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3366', 10),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'audreywellnessdb',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    seeds: [__dirname + '/database/seeds/**/*.seeder{.ts,.js}'],
    synchronize: false,
  }),
);
