import { injectable, inject } from 'inversify';
import { Knex } from 'knex';
import { TYPES } from '../types/container.types';
import { CreateUserData, IAuthRepository, UserWithPassword } from '../interfaces/auth';

@injectable()
export class AuthRepository implements IAuthRepository {
  constructor(
    @inject(TYPES.knexType) private knex: Knex
  ) {}

  /**
   * Find user by email
   * @param email User email (citext)
   * @returns User with password_hash and public data or null if not found
   */
  async findUserByEmail(email: string): Promise<UserWithPassword | undefined> {
    const user = await this.knex('users')
      .where({ email })
      .select(
        'id',
        'email',
        'password_hash',
        'first_name',
        'last_name',
        'user_type',
        'avatar_url',
        'is_active',
        'is_online',
        'last_online_at',
        'created_at',
        'updated_at'
      )
      .first();
    
    return user as UserWithPassword | undefined;
  }

  async findUserById(id: string): Promise<UserWithPassword | undefined> {
    const user = await this.knex('users')
      .where({ id })
      .select(
        'id',
        'email',
        'password_hash',
        'first_name',
        'last_name',
        'user_type',
        'avatar_url',
        'is_active',
        'is_online',
        'last_online_at',
        'created_at',
        'updated_at'
      )
      .first();
    
    return user as UserWithPassword | undefined;
  }

  async createUser(userData: CreateUserData): Promise<UserWithPassword> {
    // Crear usuario en la base de datos
    const [user] = await this.knex('users')
      .insert({
        email: userData.email,
        password_hash: userData.password_hash, // Ya viene hasheado del servicio
        first_name: userData.first_name,
        last_name: userData.last_name,
        user_type: userData.user_type,
        avatar_url: userData.avatar_url || null,
        is_active: true,
        is_online: false
      })
      .returning('*');

    return user as UserWithPassword;
  }

  // El método verifyPassword se ha movido al servicio

  async updateLastOnline(userId: string): Promise<void> {
    // Actualizar última conexión y poner usuario online
    const result = await this.knex('users')
      .where({ id: userId })
      .update({
        last_online_at: this.knex.fn.now(),
        is_online: true
      });
    
    console.log(`Usuario ${userId} actualizado. Filas afectadas: ${result}`);
  }

  async setUserOffline(userId: string): Promise<void> {
    await this.knex('users')
      .where({ id: userId })
      .update({
        is_online: false,
        last_online_at: this.knex.fn.now()
      });
  }
}