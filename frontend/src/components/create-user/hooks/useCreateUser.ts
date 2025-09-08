import { useAxiosMutation } from '../../../hooks/useAxiosQuery';
import { usersApi } from '../../../api/users.api';

interface UseCreateUserOptions {
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export const useCreateUser = (options?: UseCreateUserOptions) => {
  return useAxiosMutation({
    mutationFn: usersApi.createUser,
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
};
