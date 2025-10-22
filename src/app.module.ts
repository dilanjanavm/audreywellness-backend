import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import databaseConfig from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ItemManagementModule } from './modules/item/item-management.module';
import { CategoryModule } from './modules/category/category.module';
import { SeedModule } from './database/seeds/seed.module';
import { CustomerModule } from './modules/customer/customer.module';
import { ComplaintModule } from './modules/complaint/complaint.module';
import { AttachmentModule } from './modules/attachment/attachment.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';

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
    CustomerModule,
    ComplaintModule,
    AttachmentModule,
    SuppliersModule,
    CategoryModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
