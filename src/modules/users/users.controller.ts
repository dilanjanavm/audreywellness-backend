import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Logger,
  ParseUUIDPipe,
  ValidationPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) { }

  @Post()
  @Permissions('USER_CREATE')
  async create(
    @Body(new ValidationPipe()) createUserDto: CreateUserDto,
  ): Promise<{ message: string; data: UserResponseDto }> {
    this.logger.log(`POST /users - Creating user: ${createUserDto.email}`);
    try {
      const user = await this.usersService.create(createUserDto);
      return {
        message: 'User created successfully. Credentials sent via email.',
        data: user,
      };
    } catch (error) {
      this.logger.error(`POST /users - Error: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get()
  @Permissions('USER_VIEW')
  async findAll(): Promise<{ data: UserResponseDto[] }> {
    this.logger.log(`GET /users - Getting all users`);
    try {
      const users = await this.usersService.findAll();
      return { data: users };
    } catch (error) {
      this.logger.error(`GET /users - Error: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get(':id')
  @Permissions('USER_VIEW')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<{ data: UserResponseDto }> {
    this.logger.log(`GET /users/${id} - Getting user`);
    try {
      const user = await this.usersService.findOne(id);
      return { data: user };
    } catch (error) {
      this.logger.error(`GET /users/${id} - Error: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Put()
  @Permissions('USER_UPDATE')
  async updateProfile(
    @Request() req,
    @Body(new ValidationPipe()) updateUserDto: UpdateUserDto,
  ): Promise<{ message: string; data: UserResponseDto }> {
    const id = req.user.userId;
    this.logger.log(`PUT /users - Updating profile for user ${id}`);
    try {
      const user = await this.usersService.update(id, updateUserDto);
      return {
        message: 'Profile updated successfully',
        data: user,
      };
    } catch (error) {
      this.logger.error(`PUT /users - Error: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Put(':id')
  @Permissions('USER_UPDATE')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ValidationPipe()) updateUserDto: UpdateUserDto,
  ): Promise<{ message: string; data: UserResponseDto }> {
    this.logger.log(`PUT /users/${id} - Updating user`);
    try {
      const user = await this.usersService.update(id, updateUserDto);
      return {
        message: 'User updated successfully',
        data: user,
      };
    } catch (error) {
      this.logger.error(`PUT /users/${id} - Error: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Delete(':id')
  @Permissions('USER_DELETE')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    this.logger.log(`DELETE /users/${id} - Deleting user`);
    try {
      await this.usersService.remove(id);
      return { message: 'User deleted successfully' };
    } catch (error) {
      this.logger.error(`DELETE /users/${id} - Error: ${error.message}`, error.stack);
      throw error;
    }
  }
}
