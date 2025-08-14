/**
 * 用户服务层 - 处理用户相关的业务逻辑
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto, QueryUserDto } from '../dto/user.dto';
import { User, PaginationResponse } from '../entities/user.entity';

@Injectable()
export class UserService {
  /** 模拟用户数据存储 */
  private users: User[] = [
    {
      id: '1',
      username: 'admin',
      email: 'admin@example.com',
      avatar: 'https://avatar.example.com/admin.jpg',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      username: 'user1',
      email: 'user1@example.com',
      avatar: 'https://avatar.example.com/user1.jpg',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  /**
   * 获取所有用户（支持分页和搜索）
   */
  async findAll(query: QueryUserDto): Promise<PaginationResponse<User>> {
    let filteredUsers = [...this.users];

    // 按用户名搜索
    if (query.username) {
      filteredUsers = filteredUsers.filter(user => 
        user.username.toLowerCase().includes(query.username!.toLowerCase())
      );
    }

    // 按邮箱搜索
    if (query.email) {
      filteredUsers = filteredUsers.filter(user => 
        user.email.toLowerCase().includes(query.email!.toLowerCase())
      );
    }

    // 排序
    if (query.sortBy && query.sortBy in filteredUsers[0]) {
      filteredUsers.sort((a, b) => {
        const aValue = a[query.sortBy as keyof User];
        const bValue = b[query.sortBy as keyof User];
        
        if (!aValue || !bValue) return 0;
        
        if (query.sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    }

    // 分页计算
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;
    const total = filteredUsers.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    const items = filteredUsers.slice(startIndex, endIndex);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  /**
   * 根据ID获取用户
   */
  async findOne(id: string): Promise<User> {
    const user = this.users.find(user => user.id === id);
    if (!user) {
      throw new NotFoundException(`用户 ID ${id} 不存在`);
    }
    return user;
  }

  /**
   * 创建新用户
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    // 检查用户名是否已存在
    const existingUserByUsername = this.users.find(
      user => user.username === createUserDto.username
    );
    if (existingUserByUsername) {
      throw new BadRequestException('用户名已存在');
    }

    // 检查邮箱是否已存在
    const existingUserByEmail = this.users.find(
      user => user.email === createUserDto.email
    );
    if (existingUserByEmail) {
      throw new BadRequestException('邮箱已存在');
    }

    // 创建新用户
    const newUser: User = {
      id: Date.now().toString(), // 简单的ID生成策略
      ...createUserDto,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.users.push(newUser);
    return newUser;
  }

  /**
   * 更新用户信息
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) {
      throw new NotFoundException(`用户 ID ${id} 不存在`);
    }

    // 如果更新用户名，检查是否重复
    if (updateUserDto.username) {
      const existingUser = this.users.find(
        user => user.username === updateUserDto.username && user.id !== id
      );
      if (existingUser) {
        throw new BadRequestException('用户名已存在');
      }
    }

    // 如果更新邮箱，检查是否重复
    if (updateUserDto.email) {
      const existingUser = this.users.find(
        user => user.email === updateUserDto.email && user.id !== id
      );
      if (existingUser) {
        throw new BadRequestException('邮箱已存在');
      }
    }

    // 更新用户信息
    this.users[userIndex] = {
      ...this.users[userIndex],
      ...updateUserDto,
      updatedAt: new Date().toISOString(),
    };

    return this.users[userIndex];
  }

  /**
   * 删除用户
   */
  async remove(id: string): Promise<{ message: string }> {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) {
      throw new NotFoundException(`用户 ID ${id} 不存在`);
    }

    this.users.splice(userIndex, 1);
    return { message: '用户删除成功' };
  }

  /**
   * 批量删除用户
   */
  async removeMultiple(ids: string[]): Promise<{ message: string; deletedCount: number }> {
    let deletedCount = 0;
    
    for (const id of ids) {
      const userIndex = this.users.findIndex(user => user.id === id);
      if (userIndex !== -1) {
        this.users.splice(userIndex, 1);
        deletedCount++;
      }
    }

    return { 
      message: `成功删除 ${deletedCount} 个用户`,
      deletedCount 
    };
  }
}
