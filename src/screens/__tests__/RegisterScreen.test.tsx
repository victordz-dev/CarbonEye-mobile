import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { RegisterScreen } from '../RegisterScreen';
import { AuthContext } from '../../contexts/AuthContext';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { Alert } from 'react-native';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('../../services/api', () => ({
  post: jest.fn(),
}));

jest.spyOn(Alert, 'alert');

const mockLogin = jest.fn();
const mockNavigation = { navigate: jest.fn() } as any;

const renderWithContext = async (component: React.ReactNode) => {
  return render(
    <ThemeProvider>
      <AuthContext.Provider value={{ user: null, token: null, isLoading: false, login: mockLogin, logout: jest.fn() }}>
        {component}
      </AuthContext.Provider>
    </ThemeProvider>
  );
};

describe('RegisterScreen Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show error if fields are empty', async () => {
    const { getByText } = await renderWithContext(<RegisterScreen navigation={mockNavigation} route={{} as any} />);
    
    // Aguarda o render inicial
    await new Promise((r) => setTimeout(r, 100));
    
    fireEvent.press(getByText('Registrar & Entrar'));
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Erro de Validação', expect.any(String));
    });
  });
});
