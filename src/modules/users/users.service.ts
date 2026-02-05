// src/modules/users/users.service.ts
import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { EmailService } from '../email/email.service';
import { Role } from '../roles/entities/role.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private emailService: EmailService,
  ) { }

  /**
   * Generate a random temporary password
   */
  private generateTempPassword(): string {
    const length = 12;
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  /**
   * Create a new user with email notification
   */
  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    this.logger.log('═══════════════════════════════════════════════════════');
    this.logger.log('📝 STEP 1: Starting user creation process');
    this.logger.log(`   Email: ${createUserDto.email}`);
    this.logger.log(`   Username: ${createUserDto.userName}`);
    this.logger.log(`   Send Email: ${createUserDto.sendEmail !== false ? 'true (default)' : 'false'}`);
    this.logger.log('═══════════════════════════════════════════════════════');

    try {
      // STEP 2: Check if user with email already exists
      this.logger.log('📝 STEP 2: Checking if user with email already exists...');
      const existingUserByEmail = await this.usersRepository.findOne({
        where: { email: createUserDto.email },
      });
      if (existingUserByEmail) {
        this.logger.error(`❌ STEP 2 FAILED: User with email ${createUserDto.email} already exists`);
        throw new BadRequestException(
          `User with email ${createUserDto.email} already exists`,
        );
      }
      this.logger.log('✅ STEP 2 PASSED: Email is unique');

      // STEP 3: Check if userName already exists
      this.logger.log('📝 STEP 3: Checking if username already exists...');
      const existingUserByUserName = await this.usersRepository.findOne({
        where: { userName: createUserDto.userName },
      });
      if (existingUserByUserName) {
        this.logger.error(`❌ STEP 3 FAILED: Username ${createUserDto.userName} already exists`);
        throw new BadRequestException(
          `User with username ${createUserDto.userName} already exists`,
        );
      }
      this.logger.log('✅ STEP 3 PASSED: Username is unique');

      // STEP 4: Check if mobileNumber exists (if provided)
      if (createUserDto.mobileNumber) {
        this.logger.log('📝 STEP 4: Checking if mobile number already exists...');
        const existingUserByMobile = await this.usersRepository.findOne({
          where: { mobileNumber: createUserDto.mobileNumber },
        });
        if (existingUserByMobile) {
          this.logger.error(`❌ STEP 4 FAILED: Mobile number ${createUserDto.mobileNumber} already exists`);
          throw new BadRequestException(
            `User with mobile number ${createUserDto.mobileNumber} already exists`,
          );
        }
        this.logger.log('✅ STEP 4 PASSED: Mobile number is unique');
      } else {
        this.logger.log('⏭️  STEP 4 SKIPPED: No mobile number provided');
      }

      // STEP 5: Validate role if provided
      let role: Role | undefined;
      if (createUserDto.roleId) {
        this.logger.log(`📝 STEP 5: Validating role with ID: ${createUserDto.roleId}...`);
        role = (await this.roleRepository.findOne({
          where: { id: createUserDto.roleId },
        })) ?? undefined;
        if (!role) {
          this.logger.error(`❌ STEP 5 FAILED: Role with ID ${createUserDto.roleId} not found`);
          throw new NotFoundException(
            `Role with ID ${createUserDto.roleId} not found`,
          );
        }
        if (!role.isActive) {
          this.logger.error(`❌ STEP 5 FAILED: Role ${role.name} is not active`);
          throw new BadRequestException(
            `Role ${role.name} is not active`,
          );
        }
        this.logger.log(`✅ STEP 5 PASSED: Role ${role.name} is valid and active`);
      } else {
        this.logger.log('⏭️  STEP 5 SKIPPED: No role ID provided');
      }

      // STEP 6: Generate password
      this.logger.log('📝 STEP 6: Generating password...');
      const tempPassword = createUserDto.password || this.generateTempPassword();
      const passwordSource = createUserDto.password ? 'provided by user' : 'auto-generated';
      this.logger.log(`   Password source: ${passwordSource}`);
      this.logger.log(`   Password length: ${tempPassword.length} characters`);
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(tempPassword, salt);
      this.logger.log('✅ STEP 6 COMPLETED: Password generated and hashed');

      // STEP 7: Create user entity
      this.logger.log('📝 STEP 7: Creating user entity...');
      const newUser = this.usersRepository.create({
        userName: createUserDto.userName,
        email: createUserDto.email,
        mobileNumber: createUserDto.mobileNumber,
        address: createUserDto.address,
        contactNumber: createUserDto.contactNumber,
        age: createUserDto.age,
        gender: createUserDto.gender,
        password: hashedPassword,
        tempPassword: createUserDto.password ? undefined : tempPassword,
        roleId: createUserDto.roleId,
        mustChangePassword: !createUserDto.password, // Must change if temp password
        isActive: true,
        isEmailVerified: false,
      });
      this.logger.log('✅ STEP 7 COMPLETED: User entity created');

      // STEP 8: Save user to database
      this.logger.log('📝 STEP 8: Saving user to database...');
      const savedUser = await this.usersRepository.save(newUser);
      this.logger.log(`✅ STEP 8 COMPLETED: User saved with ID: ${savedUser.id}`);

      // STEP 9: Send welcome email
      this.logger.log('═══════════════════════════════════════════════════════');
      this.logger.log('📧 STEP 9: Email sending process');
      this.logger.log('═══════════════════════════════════════════════════════');

      if (createUserDto.sendEmail === false) {
        this.logger.log('⏭️  STEP 9 SKIPPED: sendEmail is set to false');
      } else {
        this.logger.log(`   Email will be sent to: ${savedUser.email}`);
        this.logger.log(`   Username: ${savedUser.userName}`);
        this.logger.log(`   Temporary Password: ${tempPassword}`);

        try {
          this.logger.log('   📤 Attempting to send email...');
          const emailSent = await this.emailService.sendWelcomeEmail(
            savedUser.email,
            savedUser.userName,
            tempPassword,
          );

          if (emailSent) {
            this.logger.log('✅ STEP 9 COMPLETED: Welcome email sent successfully');
          } else {
            this.logger.warn('⚠️  STEP 9 WARNING: Email sending returned false');
            this.logger.warn(`   User was created successfully, but email may not have been sent to ${savedUser.email}`);
            this.logger.warn('   Check email service logs for details');
          }
        } catch (emailError: any) {
          this.logger.error('❌ STEP 9 ERROR: Exception occurred while sending email');
          this.logger.error(`   Error: ${emailError.message}`);
          this.logger.error(`   Stack: ${emailError.stack}`);
          this.logger.warn('   User was created successfully despite email error');
        }
      }

      this.logger.log('═══════════════════════════════════════════════════════');
      this.logger.log('✅ USER CREATION PROCESS COMPLETED');
      this.logger.log(`   User ID: ${savedUser.id}`);
      this.logger.log(`   Email: ${savedUser.email}`);
      this.logger.log(`   Username: ${savedUser.userName}`);
      this.logger.log('═══════════════════════════════════════════════════════');

      return this.mapToResponseDto(savedUser, role);
    } catch (error) {
      this.logger.error('═══════════════════════════════════════════════════════');
      this.logger.error('❌ USER CREATION PROCESS FAILED');
      this.logger.error(`   Error: ${error.message}`);
      this.logger.error(`   Stack: ${error.stack}`);
      this.logger.error('═══════════════════════════════════════════════════════');

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  /**
   * Find user by email
   */
  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['role'],
    });
  }

  /**
   * Find user by ID
   */
  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.mapToResponseDto(user, user.role);
  }

  /**
   * Find all users
   */
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersRepository.find({
      relations: ['role'],
      order: { createdAt: 'DESC' },
    });

    return users.map((user) => this.mapToResponseDto(user, user.role));
  }

  /**
   * Update user
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Validate role if provided
    if (updateUserDto.roleId) {
      const role = await this.roleRepository.findOne({
        where: { id: updateUserDto.roleId },
      });
      if (!role) {
        throw new NotFoundException(
          `Role with ID ${updateUserDto.roleId} not found`,
        );
      }
    }

    // Check for unique constraints before update
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({ where: { email: updateUserDto.email } });
      if (existingUser && existingUser.id !== id) {
        throw new BadRequestException(`Email ${updateUserDto.email} is already in use`);
      }
    }

    if (updateUserDto.userName && updateUserDto.userName !== user.userName) {
      const existingUser = await this.usersRepository.findOne({ where: { userName: updateUserDto.userName } });
      if (existingUser && existingUser.id !== id) {
        throw new BadRequestException(`Username ${updateUserDto.userName} is already in use`);
      }
    }

    if (updateUserDto.mobileNumber && updateUserDto.mobileNumber !== user.mobileNumber) {
      const existingUser = await this.usersRepository.findOne({ where: { mobileNumber: updateUserDto.mobileNumber } });
      if (existingUser && existingUser.id !== id) {
        throw new BadRequestException(`Mobile number ${updateUserDto.mobileNumber} is already in use`);
      }
    }

    // Update user fields
    Object.assign(user, updateUserDto);

    const updatedUser = await this.usersRepository.save(user);

    // Reload with relations
    const reloadedUser = await this.usersRepository.findOne({
      where: { id: updatedUser.id },
      relations: ['role'],
    });

    return this.mapToResponseDto(reloadedUser!, reloadedUser!.role);
  }

  /**
   * Delete user (hard delete - permanently removes from database)
   */
  async remove(id: string): Promise<void> {
    this.logger.log('═══════════════════════════════════════════════════════');
    this.logger.log('🗑️  STEP 1: Starting user deletion process');
    this.logger.log(`   User ID: ${id}`);
    this.logger.log('═══════════════════════════════════════════════════════');

    try {
      // STEP 1: Check if user exists
      this.logger.log('📝 STEP 1: Checking if user exists...');
      const user = await this.usersRepository.findOne({
        where: { id },
        relations: ['role'],
      });

      if (!user) {
        this.logger.error(`❌ STEP 1 FAILED: User with ID ${id} not found`);
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      this.logger.log(`✅ STEP 1 PASSED: User found`);
      this.logger.log(`   Username: ${user.userName}`);
      this.logger.log(`   Email: ${user.email}`);
      this.logger.log(`   Is Active: ${user.isActive}`);

      // STEP 2: Delete the user from database
      this.logger.log('📝 STEP 2: Deleting user from database...');
      const deleteResult = await this.usersRepository.delete({ id });

      if (deleteResult.affected === 0) {
        this.logger.error(`❌ STEP 2 FAILED: No rows were deleted`);
        throw new NotFoundException(
          `User with ID ${id} not found or could not be deleted`,
        );
      }

      this.logger.log(`✅ STEP 2 COMPLETED: User deleted successfully`);
      this.logger.log(`   Rows affected: ${deleteResult.affected}`);
      this.logger.log('═══════════════════════════════════════════════════════');
      this.logger.log(`✅ USER DELETION COMPLETED: ${id}`);
      this.logger.log('═══════════════════════════════════════════════════════');
    } catch (error: any) {
      this.logger.error('═══════════════════════════════════════════════════════');
      this.logger.error('❌ USER DELETION PROCESS FAILED');
      this.logger.error(`   User ID: ${id}`);
      this.logger.error(`   Error: ${error.message}`);
      this.logger.error(`   Stack: ${error.stack}`);
      this.logger.error('═══════════════════════════════════════════════════════');

      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to delete user: ${error.message}`,
      );
    }
  }

  /**
   * Alias method for AuthService compatibility
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.findOneByEmail(email);
  }

  /**
   * Map user entity to response DTO
   */
  private mapToResponseDto(
    user: User,
    role?: Role,
  ): UserResponseDto {
    return {
      id: user.id,
      userName: user.userName,
      email: user.email,
      mobileNumber: user.mobileNumber,
      address: user.address,
      contactNumber: user.contactNumber,
      age: user.age,
      gender: user.gender,
      roleId: user.roleId,
      role: role
        ? {
          id: role.id,
          name: role.name,
          code: role.code,
        }
        : undefined,
      legacyRole: user.legacyRole,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      mustChangePassword: user.mustChangePassword,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
