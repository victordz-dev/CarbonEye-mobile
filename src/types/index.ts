export interface Alerta {
  id: string;
  areaId: string;
  tipo: string;
  mensagem: string;
  lida: boolean;
  criadoEm: string;
}

export interface Area {
  id: string;
  usuarioId: string;
  nome: string;
  geometria: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  status: 'NORMAL' | 'ALERTA' | 'EMERGENCIA';
  siriAtual: number | null;
  classificacaoAtual: string | null;
  ultimaAnalise: string | null;
  monitoramentoAtivo: boolean;
  agroPolygonId: string | null;
  criadoEm: string;
  alertas?: Alerta[];
}

export interface User {
  id: string;
  nome: string;
  email: string;
  cpf: string;
}
