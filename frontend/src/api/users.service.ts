import axios from 'axios';
import { User } from '../types/user';

export const getAllUsers = async (filters?: any): Promise<User[]> => {
  const { data } = await axios.get('/api/users', { params: filters });
  return data;
};

export const getUserById = async (id: string): Promise<User> => {
  const { data } = await axios.get(`/api/users/${id}`);
  return data;
};

export const createUser = async (userData: {
  username: string;
  email: string;
  password: string;
  role?: string;
}): Promise<User> => {
  const { data } = await axios.post('/api/users', userData);
  return data;
};

export const updateUser = async (id: string, userData: Partial<User>): Promise<User> => {
  const { data } = await axios.put(`/api/users/${id}`, userData);
  return data;
};

export const deleteUser = async (id: string): Promise<void> => {
  await axios.delete(`/api/users/${id}`);
};