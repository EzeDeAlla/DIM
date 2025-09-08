import { injectable, inject } from 'inversify';
import bcrypt from 'bcryptjs';
import { TYPES } from '../types/container.types';
import { IAuthRepository } from '../interfaces/auth';
import { UserWithPassword, UserWithoutPassword } from '../interfaces/auth';
import { LoginSchema, RegisterSchema, LoginCredentials } from '../../../shared/schemas';
import { Register, AuthResponse } from '../interfaces/auth';
import * as jwtUtil from '../utils/jwt.util';

@injectable()
export class AuthService {
  constructor(
    @inject(TYPES.AuthRepository) private authRepository: IAuthRepository
  ) {}

  async register(registerData: Register): Promise<AuthResponse> {
    // Validar datos con Zod
    RegisterSchema.parse(registerData);
    
    // Verificar si el usuario ya existe
    const existingUser = await this.authRepository.findUserByEmail(registerData.email);
    if (existingUser) {
      throw new Error('El usuario ya existe');
    }

    // Hash de la contraseña
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(registerData.password, saltRounds);
    
    // Crear el usuario con la contraseña hasheada
    const createUserData = {
      email: registerData.email,
      password_hash,
      first_name: registerData.first_name,
      last_name: registerData.last_name,
      user_type: registerData.user_type as 'doctor' | 'admin' | 'administrador',
      specialty: registerData.specialty,
      description: registerData.description
    };
    
    const user = await this.authRepository.createUser(createUserData);
    
    // Generar token
    const token = jwtUtil.sign({ sub: user.id });
    
    // Actualizar última conexión
    await this.authRepository.updateLastOnline(user.id);

    // Remover password_hash de la respuesta
    const { password_hash: _, ...userWithoutPassword } = user;
    
    // El usuario ya viene con fechas en formato string desde la BD
    const userFormatted = {
      ...userWithoutPassword
    };
    
    return {
      user: userFormatted,
      token,
      refresh_token: token, // Por ahora usamos el mismo token
      expires_in: 24 * 60 * 60 // 24 horas en segundos
    };
  }

  /**
   * Login user with email and password
   * @param credentials Login credentials
   * @returns Access token and user data
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Validar datos con Zod
    const validatedData = LoginSchema.safeParse(credentials);
    if (!validatedData.success) {
      throw new Error('Credenciales inválidas');
    }
    
    // Buscar usuario por email
    const user = await this.authRepository.findUserByEmail(validatedData.data.email);
    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    // Verificar contraseña (ahora en el servicio, no en el repositorio)
    const isValidPassword = await bcrypt.compare(validatedData.data.password, user.password_hash);
    
    if (!isValidPassword) {
      throw new Error('Credenciales inválidas');
    }

    // Verificar si la cuenta está activa
    if (!user.is_active) {
      throw new Error('La cuenta está desactivada. Contacta al administrador.');
    }

    // Actualizar última conexión
    await this.authRepository.updateLastOnline(user.id);
    
    // Generar token
    const token = jwtUtil.sign({ sub: user.id });
    
    // Remover password_hash de la respuesta y convertir fechas a string
    const { password_hash, ...userWithoutPassword } = user;
    
    // Convertir fechas a formato string para cumplir con el esquema
    const userFormatted = this.formatUserDates(userWithoutPassword);
    
    return {
      user: userFormatted,
      token,
      refresh_token: token, // Por ahora usamos el mismo token
      expires_in: 24 * 60 * 60 // 24 horas en segundos
    };
  }

  async logout(userId: string): Promise<void> {
    await this.authRepository.setUserOffline(userId);
  }

  async setUserOnline(userId: string): Promise<void> {
    await this.authRepository.updateLastOnline(userId);
  }

  async setUserOffline(userId: string): Promise<void> {
    await this.authRepository.setUserOffline(userId);
  }

  /**
   * Get user data by ID
   * @param userId User ID
   * @returns User data and token
   */
  async me(userId: string): Promise<AuthResponse> {
    // Buscar usuario por id
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    
    // Actualizar última conexión
    await this.authRepository.updateLastOnline(user.id);

    // Generar token JWT
    const token = jwtUtil.sign({ sub: user.id });
    
    // Remover password_hash de la respuesta y convertir fechas a string
    const { password_hash, ...userWithoutPassword } = user;
    
    // Convertir fechas a formato string para cumplir con el esquema
    const userFormatted = this.formatUserDates(userWithoutPassword);
    
    return {
      user: userFormatted,
      token,
      refresh_token: token, // Por ahora usamos el mismo token
      expires_in: 24 * 60 * 60 // 24 horas en segundos
    };
  }

  async verifyToken(token: string): Promise<string> {
    try {
      const decoded = jwtUtil.verify(token) as { sub: string };
      return decoded.sub;
    } catch (error) {
      throw new Error('Token inválido');
    }
  }



  /**
   * Format user dates to ISO string
   * @param user User object
   * @returns User with dates formatted as ISO strings
   */
  private formatUserDates(user: any): any {
    return {
      ...user,
      last_online_at: user.last_online_at ? user.last_online_at.toISOString() : null,
      created_at: user.created_at.toISOString(),
      updated_at: user.updated_at.toISOString()
    };
  }
}