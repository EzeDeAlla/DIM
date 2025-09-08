import { injectable, inject } from 'inversify';
import { User, CreateUser, UpdateUser } from '../../../shared/schemas';
import { ApiResponse } from '../interfaces/common';
import { TYPES } from '../types/container.types';
import { IUserRepository, ContactSearchParams, UpdateAvatarData, ContactsResponse, CreateUserByAdminData } from '../interfaces/users';
import { FileService } from '../services/file.service';
import bcrypt from 'bcryptjs';

@injectable()
export class UserService {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: IUserRepository,
    @inject(TYPES.FileService) private fileService: FileService
  ) {}

  async getAllUsers(): Promise<ApiResponse<User[]>> {
    try {
      const users = await this.userRepository.findAll();
      return {
        success: true,
        data: users
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve users',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  async getUserById(id: string): Promise<ApiResponse<User>> {
    try {
      const user = await this.userRepository.findById(id);
      if (!user) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Usuario no encontrado'
          }
        };
      }
      return {
        success: true,
        data: user
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve user',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  async createUser(userData: CreateUser): Promise<ApiResponse<User>> {
    try {
      const user = await this.userRepository.create(userData);
      return {
        success: true,
        data: user
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create user',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  async updateUser(id: string, userData: UpdateUser): Promise<ApiResponse<User>> {
    try {
      const user = await this.userRepository.update(id, userData);
      if (!user) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Usuario no encontrado'
          }
        };
      }
      return {
        success: true,
        data: user
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update user',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    try {
      const deleted = await this.userRepository.delete(id);
      if (!deleted) {
        return {
          success: false,
          error: {
            code: 'DELETE_FAILED',
            message: 'Error al eliminar usuario'
          }
        };
      }
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete user',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  async getProfile(userId: string): Promise<ApiResponse<User>> {
    return this.getUserById(userId);
  }

  async updateProfile(userId: string, userData: UpdateUser): Promise<ApiResponse<User>> {
    return this.updateUser(userId, userData);
  }

  async updateAvatar(userId: string, avatarData: UpdateAvatarData): Promise<ApiResponse<User>> {
    try {
      // Obtener el usuario actual para eliminar la imagen anterior si existe
      const currentUser = await this.userRepository.findById(userId);
      if (!currentUser) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'User not found'
          }
        };
      }

      let avatarUrl = avatarData.avatar_url;

      // Si es base64, convertir a archivo y obtener URL
      if (avatarData.avatar_url.startsWith('data:image/')) {
        try {
          avatarUrl = await this.fileService.saveBase64Image(avatarData.avatar_url);
          
          // Eliminar imagen anterior si existe y es una URL de nuestro servidor
          if (currentUser.avatar_url && this.fileService.isValidImageUrl(currentUser.avatar_url)) {
            await this.fileService.deleteImage(currentUser.avatar_url);
          }
        } catch (fileError) {
          return {
            success: false,
            error: {
              code: 'FILE_ERROR',
              message: fileError instanceof Error ? fileError.message : 'Error processing image file'
            }
          };
        }
      }

      const updatedUser = await this.userRepository.updateAvatar(userId, { avatar_url: avatarUrl });
      if (!updatedUser) {
        return {
          success: false,
          error: {
            code: 'UPDATE_FAILED',
            message: 'Error al actualizar avatar'
          }
        };
      }
      
      return {
        success: true,
        data: updatedUser
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update avatar',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  async getContacts(params: ContactSearchParams): Promise<ApiResponse<ContactsResponse>> {
    try {
      const limit = params.limit || 20;
      const offset = params.offset || 0;
      const page = Math.floor(offset / limit) + 1;

      const [users, total] = await Promise.all([
        this.userRepository.findContacts({ ...params, limit, offset }),
        this.userRepository.getContactsCount(params)
      ]);

      return {
        success: true,
        data: {
          users,
          total,
          page,
          limit
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve contacts',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  async getOnlineUsers(): Promise<ApiResponse<User[]>> {
    try {
      const users = await this.userRepository.findOnlineUsers();
      return {
        success: true,
        data: users
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve online users',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  async createUserByAdmin(userData: CreateUserByAdminData): Promise<ApiResponse<User>> {
    try {
      // Verificar si el usuario ya existe
      const existingUser = await this.userRepository.findByEmail(userData.email);
      if (existingUser) {
        return {
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'User with this email already exists'
          }
        };
      }

      // Hash de la contraseña
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(userData.password, saltRounds);

      // Transformar CreateUserByAdminData a CreateUser
      const userType = userData.user_type || 'administrador';
      const createUserData: CreateUser = {
        email: userData.email,
        password_hash, // Contraseña hasheada
        first_name: userData.first_name,
        last_name: userData.last_name,
        user_type: userType,
        is_active: true,
        is_online: false
      };

      const newUser = await this.userRepository.create(createUserData);
      return {
        success: true,
        data: newUser
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create user',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
}