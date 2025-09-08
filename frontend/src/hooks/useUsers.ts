import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAxiosQuery } from './useAxiosQuery';
import * as usersService from '../api/users.service';
import type { User } from '../types/user';

const USERS_QUERY_KEYS = {
  all: ['users'] as const,
  list: (filters?: any) => [...USERS_QUERY_KEYS.all, 'list', filters] as const,
  detail: (id: string) => [...USERS_QUERY_KEYS.all, 'detail', id] as const,
};

export const useUsers = (filters?: any) => {
  return useAxiosQuery<User[]>({    
    queryKey: USERS_QUERY_KEYS.list(filters),
    queryFn: () => usersService.getAllUsers(filters)
  });
};

export const useUser = (id: string) => {
  return useAxiosQuery<User>({    
    queryKey: USERS_QUERY_KEYS.detail(id),
    queryFn: () => usersService.getUserById(id)
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation<User, Error, any>({    
    mutationFn: usersService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.all });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation<User, Error, { id: string; data: Partial<User> }>({    
    mutationFn: ({ id, data }) => usersService.updateUser(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.all });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({    
    mutationFn: usersService.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.all });
    },
  });
};

export const useUserOperations = () => {
  const { mutate: createUser, isPending: isCreating } = useCreateUser();
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();
  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser();

  return {
    createUser,
    updateUser,
    deleteUser,
    isCreating,
    isUpdating,
    isDeleting,
  };
};