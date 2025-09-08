import { injectable, inject } from 'inversify';
import { Knex } from 'knex';
import { User, CreateUser, UpdateUser } from '../../../shared/schemas';
import { TYPES } from '../types/container.types';
import { ContactSearchParams, UpdateAvatarData, IUserRepository } from '../interfaces/users';

@injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @inject(TYPES.knexType) private readonly knex: Knex
  ) {}

  async findAll(): Promise<User[]> {
    return await this.knex('users')
      .select('*')
      .where('is_active', true)
      .orderBy('created_at', 'desc');
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.knex('users')
      .select('*')
      .where({ id, is_active: true })
      .first();
    
    return user || null;
  }

  async create(userData: CreateUser): Promise<User> {
    const [newUser] = await this.knex('users')
      .insert({
        ...userData,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');
    
    return newUser;
  }

  async update(id: string, userData: UpdateUser): Promise<User | null> {
    const [updatedUser] = await this.knex('users')
      .where({ id, is_active: true })
      .update({
        ...userData,
        updated_at: new Date(),
      })
      .returning('*');
    
    return updatedUser || null;
  }

  async delete(id: string): Promise<boolean> {
    const deletedCount = await this.knex('users')
      .where({ id })
      .update({
        is_active: false,
        updated_at: new Date(),
      });
    
    return deletedCount > 0;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.knex('users')
      .select('*')
      .where({ email, is_active: true })
      .first();
    
    return user || null;
  }

  async updateAvatar(id: string, avatarData: UpdateAvatarData): Promise<User | null> {
    const [updatedUser] = await this.knex('users')
      .where({ id, is_active: true })
      .update({
        ...avatarData,
        updated_at: new Date()
      })
      .returning('*');
    
    return updatedUser || null;
  }

  async findContacts(params: ContactSearchParams): Promise<User[]> {
    console.log('🔍 [DEBUG] findContacts params:', params);
    let query = this.knex('users')
      .select('id', 'first_name', 'last_name', 'user_type', 'specialty', 'avatar_url', 'is_online')
    .where('is_active', true);

    if (params.search) {
      query = query.where(function() {
        this.whereILike('first_name', `%${params.search}%`)
          .orWhereILike('last_name', `%${params.search}%`)
          .orWhereILike('email', `%${params.search}%`)
          .orWhereILike('specialty', `%${params.search}%`);
      });
    }

    if (params.user_type) {
      query = query.where('user_type', params.user_type);
    }

    if (params.is_online !== undefined) {
      query = query.where('is_online', params.is_online);
    }

    if (params.limit) {
      query = query.limit(params.limit);
    }

    if (params.offset) {
      query = query.offset(params.offset);
    }

    console.log('🔍 [DEBUG] SQL query:', query.toString());
    const users = await query.orderBy('first_name', 'asc');
    console.log('🔍 [DEBUG] Found users:', users.length);
    return users;
  }

  async findOnlineUsers(): Promise<User[]> {
    return this.knex('users')
      .select('id', 'email', 'first_name', 'last_name', 'user_type', 'avatar_url', 'is_active', 'is_online', 'last_online_at')
      .where({ is_online: true, is_active: true })
      .orderBy('last_online_at', 'desc');
  }

  async getContactsCount(params: Omit<ContactSearchParams, 'limit' | 'offset'>): Promise<number> {
    let query = this.knex('users')
      .count('* as count')
      .where('is_active', true);

    if (params.search) {
      query = query.where(function() {
        this.whereILike('first_name', `%${params.search}%`)
          .orWhereILike('last_name', `%${params.search}%`)
          .orWhereILike('email', `%${params.search}%`)
          .orWhereILike('specialty', `%${params.search}%`);
      });
    }

    if (params.user_type) {
      query = query.where('user_type', params.user_type);
    }

    if (params.is_online !== undefined) {
      query = query.where('is_online', params.is_online);
    }

    const result = await query.first();
    return parseInt(result?.count as string) || 0;
  }
}