import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../modules/users/user.entity';
import { SeedService } from './seed.service';
import { AppModule } from '../../app.module'; // Import AppModule

@Module({
  imports: [
    AppModule, // Import the main AppModule to get the DB connection
    TypeOrmModule.forFeature([User]),
  ],
  providers: [SeedService],
})
export class SeedModule {}
