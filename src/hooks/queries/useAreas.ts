import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import api from '../../services/api';
import { Area } from '../../types';

export const useAreas = () => {
  const queryClient = useQueryClient();

  const areasQuery = useQuery({
    queryKey: ['areas'],
    queryFn: async () => {
      const response = await api.get<Area[]>('/areas');
      return response.data;
    }
  });

  const deleteAreaMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/areas/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
    },
    onError: () => Alert.alert('Erro', 'Não foi possível excluir a área.')
  });

  const toggleMonitorMutation = useMutation({
    mutationFn: ({ id, ativo }: { id: string, ativo: boolean }) => 
      api.patch(`/areas/${id}/monitoramento`, { monitoramento_ativo: ativo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || '';
      if (typeof msg === 'string' && msg.includes('INTEGRATION_ERROR')) {
        Alert.alert(
          'Erro de Integração',
          'Não foi possível comunicar com o satélite no momento. Tente novamente mais tarde.'
        );
      } else {
        Alert.alert('Erro', 'Não foi possível alterar o monitoramento.');
      }
    }
  });

  const renameAreaMutation = useMutation({
    mutationFn: ({ id, nome }: { id: string, nome: string }) => 
      api.patch(`/areas/${id}/nome`, { nome }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
    },
    onError: () => Alert.alert('Erro', 'Não foi possível renomear a área.')
  });

  return {
    areas: areasQuery.data || [],
    isLoading: areasQuery.isLoading,
    deleteArea: deleteAreaMutation.mutate,
    toggleMonitor: toggleMonitorMutation.mutate,
    renameArea: renameAreaMutation.mutate,
  };
};
