export interface ThemeColors {
  primary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  danger: string;
  cardBg: string;
}

export const lightColors: ThemeColors = {
  primary: '#0284c7',
  background: '#f8fafc',
  surface: '#ffffff',
  text: '#0f172a',
  textSecondary: '#475569',
  border: '#e2e8f0',
  success: '#16a34a',
  warning: '#ca8a04',
  danger: '#dc2626',
  cardBg: '#ffffff',
};

export const darkColors: ThemeColors = {
  primary: '#38bdf8',
  background: '#0f172a',
  surface: '#1e293b',
  text: '#f8fafc',
  textSecondary: '#94a3b8',
  border: '#334155',
  success: '#22c55e',
  warning: '#eab308',
  danger: '#ef4444',
  cardBg: '#1e293b',
};
