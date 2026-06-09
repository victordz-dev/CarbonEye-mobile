import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Area } from '../../types';
import { useAlert } from '../index';

export const useAreas = () => {
  const queryClient = useQueryClient();
  const { alert } = useAlert();

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
    onError: () => alert('Erro', 'Não foi possível excluir a área.')
  });

  // Monitoramento é unidirecional: só pode desativar (nunca reativar)
  const disableMonitorMutation = useMutation({
    mutationFn: (id: string) => 
      api.patch(`/areas/${id}/monitoramento`, { monitoramento_ativo: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || '';
      if (typeof msg === 'string' && msg.includes('INTEGRATION_ERROR')) {
        alert(
          'Erro de Integração',
          'Não foi possível comunicar com o satélite no momento. Tente novamente mais tarde.'
        );
      } else {
        alert('Erro', 'Não foi possível desativar o monitoramento.');
      }
    }
  });

  const renameAreaMutation = useMutation({
    mutationFn: ({ id, nome }: { id: string, nome: string }) => 
      api.patch(`/areas/${id}/nome`, { nome }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
    },
    onError: () => alert('Erro', 'Não foi possível renomear a área.')
  });

  return {
    areas: areasQuery.data || [],
    isLoading: areasQuery.isLoading,
    deleteArea: deleteAreaMutation.mutate,
    disableMonitor: disableMonitorMutation.mutate,
    renameArea: renameAreaMutation.mutate,
  };
};

