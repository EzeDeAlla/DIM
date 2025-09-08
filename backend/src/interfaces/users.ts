// Interfaces específicas del dominio de usuarios

import { User, CreateUser, UpdateUser } from '../../../shared/schemas';

export interface ContactSearchParams {
  search?: string;
  user_type?: 'doctor' | 'admin' | 'administrador';
  is_online?: boolean;
  limit?: number;
  offset?: number;
}

export interface UpdateAvatarData {
  avatar_url: string;
}

export interface ContactsResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateUserByAdminData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  user_type: 'doctor' | 'admin' | 'administrador';
  specialty?: string;
  description?: string;
}

export interface IUserRepository {
  findAll(): Promise<User[]>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: CreateUser): Promise<User>;
  update(id: string, user: UpdateUser): Promise<User | null>;
  updateAvatar(id: string, avatarData: UpdateAvatarData): Promise<User | null>;
  delete(id: string): Promise<boolean>;
  findContacts(params: ContactSearchParams): Promise<User[]>;
  findOnlineUsers(): Promise<User[]>;
  getContactsCount(params: Omit<ContactSearchParams, 'limit' | 'offset'>): Promise<number>;
}