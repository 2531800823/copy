/**
 * 用户控制器 - 处理用户相关的HTTP请求
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from '../services/user.service';
import { CreateUserDto, UpdateUserDto, QueryUserDto } from '../dto/user.dto';
import { ApiResponse, User, PaginationResponse } from '../entities/user.entity';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * 获取用户列表（支持分页和搜索）
   * GET /users?page=1&pageSize=10&username=admin&sortBy=createdAt&sortOrder=desc
   */
  @Get()
  async findAll(@Query() query: QueryUserDto): Promise<ApiResponse<PaginationResponse<User>>> {
    try {
      const data = await this.userService.findAll(query);
      return {
        success: true,
        data,
        message: '获取用户列表成功',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        data: null as any,
        message: error instanceof Error ? error.message : '获取用户列表失败',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 根据ID获取单个用户
   * GET /users/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponse<User>> {
    try {
      const data = await this.userService.findOne(id);
      return {
        success: true,
        data,
        message: '获取用户信息成功',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        data: null as any,
        message: error instanceof Error ? error.message : '获取用户信息失败',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 创建新用户
   * POST /users
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto): Promise<ApiResponse<User>> {
    try {
      const data = await this.userService.create(createUserDto);
      return {
        success: true,
        data,
        message: '用户创建成功',
        code: HttpStatus.CREATED,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        data: null as any,
        message: error instanceof Error ? error.message : '用户创建失败',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 更新用户信息
   * PATCH /users/:id
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<ApiResponse<User>> {
    try {
      const data = await this.userService.update(id, updateUserDto);
      return {
        success: true,
        data,
        message: '用户信息更新成功',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        data: null as any,
        message: error instanceof Error ? error.message : '用户信息更新失败',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 删除用户
   * DELETE /users/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const data = await this.userService.remove(id);
      return {
        success: true,
        data,
        message: '用户删除成功',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        data: null as any,
        message: error instanceof Error ? error.message : '用户删除失败',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 批量删除用户
   * DELETE /users/batch
   */
  @Delete('batch')
  @HttpCode(HttpStatus.OK)
  async removeMultiple(
    @Body('ids') ids: string[],
  ): Promise<ApiResponse<{ message: string; deletedCount: number }>> {
    try {
      const data = await this.userService.removeMultiple(ids);
      return {
        success: true,
        data,
        message: '批量删除用户成功',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        data: null as any,
        message: error instanceof Error ? error.message : '批量删除用户失败',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
