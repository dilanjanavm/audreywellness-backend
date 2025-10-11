// src/database/seed/seed.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../modules/users/user.entity';
import { UserRole } from '../../common/enums/role.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async run() {
    const adminEmail = 'admin@app.com';
    const adminPassword = '1234';

    const existingAdmin = await this.userRepository.findOneBy({
      email: adminEmail,
    });

    if (existingAdmin) {
      console.log('Admin user already exists. Seeding skipped.');
      return;
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    const adminUser = this.userRepository.create({
      email: adminEmail,
      password: hashedPassword,
      role: UserRole.ADMIN,
    });

    await this.userRepository.save(adminUser);
    console.log('✅ Super Admin user created successfully.');
  }
}