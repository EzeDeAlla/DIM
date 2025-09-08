import apiClient from './axios.config';
import { User } from '../types/user';

export const getContacts = async (userType?: string, searchTerm?: string) => {
  const params = new URLSearchParams();
  if (userType && userType !== 'ALL') params.append('user_type', userType);
  if (searchTerm) params.append('search', searchTerm);
  
  const { data } = await apiClient.get<User[]>('/users', { params });
  return data;
};
