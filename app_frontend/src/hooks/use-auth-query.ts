import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';
import { AxiosError } from 'axios';

export const useAuthQuery = <T>(url: string, queryKey: string[]) => {
  return useQuery<T>({
    queryKey,
    queryFn: async () => {
      const { data } = await api.get<T>(url);
      return data;
    },
    retry: (failureCount, error) => {
      return (error as AxiosError)?.response?.status !== 401 && failureCount < 3;
    }
  });
};
