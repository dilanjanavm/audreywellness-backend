import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import databaseConfig from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ItemManagementModule } from './modules/item/item-management.module';
import { CategoryModule } from './modules/category/category.module';
import { SeedModule } from './database/seeds/seed.module';

@Module({
  imports: [
    // THIS MUST BE FIRST
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),

    // This will now work correctly
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        configService.get('database') as TypeOrmModuleOptions,
      inject: [ConfigService],
    }),

    // Your feature modules
    AuthModule,
    UsersModule,
    ItemManagementModule,
    SeedModule,
    CategoryModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
