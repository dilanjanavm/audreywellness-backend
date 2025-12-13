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
  ) {}

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
    this.logger.log(`Creating user with email: ${createUserDto.email}`);

    try {
      // Check if user with email already exists
      const existingUserByEmail = await this.usersRepository.findOne({
        where: { email: createUserDto.email },
      });
      if (existingUserByEmail) {
        throw new BadRequestException(
          `User with email ${createUserDto.email} already exists`,
        );
      }

      // Check if userName already exists
      const existingUserByUserName = await this.usersRepository.findOne({
        where: { userName: createUserDto.userName },
      });
      if (existingUserByUserName) {
        throw new BadRequestException(
          `User with username ${createUserDto.userName} already exists`,
        );
      }

      // Check if mobileNumber exists (if provided)
      if (createUserDto.mobileNumber) {
        const existingUserByMobile = await this.usersRepository.findOne({
          where: { mobileNumber: createUserDto.mobileNumber },
        });
        if (existingUserByMobile) {
          throw new BadRequestException(
            `User with mobile number ${createUserDto.mobileNumber} already exists`,
          );
        }
      }

      // Validate role if provided
      let role: Role | undefined;
      if (createUserDto.roleId) {
        role = (await this.roleRepository.findOne({
          where: { id: createUserDto.roleId },
        })) ?? undefined;
        if (!role) {
          throw new NotFoundException(
            `Role with ID ${createUserDto.roleId} not found`,
          );
        }
        if (!role.isActive) {
          throw new BadRequestException(
            `Role ${role.name} is not active`,
          );
        }
      }

      // Generate password (use provided or generate temp password)
      const tempPassword = createUserDto.password || this.generateTempPassword();
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(tempPassword, salt);

      // Create user
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

      const savedUser = await this.usersRepository.save(newUser);

      // Send welcome email if requested (default: true)
      if (createUserDto.sendEmail !== false) {
        const emailSent = await this.emailService.sendWelcomeEmail(
          savedUser.email,
          savedUser.userName,
          tempPassword,
        );
        if (!emailSent) {
          this.logger.warn(
            `Failed to send welcome email to ${savedUser.email}, but user was created`,
          );
        }
      }

      this.logger.log(
        `User created successfully: ${savedUser.id} (${savedUser.email})`,
      );

      return this.mapToResponseDto(savedUser, role);
    } catch (error) {
      this.logger.error(
        `Error creating user: ${error.message}`,
        error.stack,
      );
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
   * Delete user (soft delete by setting isActive to false)
   */
  async remove(id: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    user.isActive = false;
    await this.usersRepository.save(user);

    this.logger.log(`User deactivated: ${id}`);
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
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      mustChangePassword: user.mustChangePassword,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
