import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { RegisterScreen } from '../RegisterScreen';
import { AuthContext } from '../../contexts/AuthContext';
import { Alert } from 'react-native';

jest.mock('../../services/api', () => ({
  post: jest.fn(),
}));

jest.spyOn(Alert, 'alert');

const mockLogin = jest.fn();
const mockNavigation = { navigate: jest.fn() } as any;

const renderWithContext = (component: React.ReactNode) => {
  return render(
    <AuthContext.Provider value={{ user: null, token: null, isLoading: false, login: mockLogin, logout: jest.fn() }}>
      {component}
    </AuthContext.Provider>
  );
};

describe('RegisterScreen Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show error if fields are empty', async () => {
    const { getByText } = renderWithContext(<RegisterScreen navigation={mockNavigation} route={{} as any} />);
    
    fireEvent.press(getByText('Criar Conta'));
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Erro de Validação', expect.any(String));
    });
  });

  it('should show error if CPF is invalid', async () => {
    const { getByText, getByPlaceholderText } = renderWithContext(<RegisterScreen navigation={mockNavigation} route={{} as any} />);
    
    fireEvent.changeText(getByPlaceholderText('Digite seu nome completo'), 'Test User');
    fireEvent.changeText(getByPlaceholderText('Digite seu CPF (apenas números)'), '11111111111'); // CPF inválido matematicamente
    fireEvent.changeText(getByPlaceholderText('Digite seu melhor e-mail'), 'test@test.com');
    fireEvent.changeText(getByPlaceholderText('Crie uma senha forte'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Repita sua senha'), 'password123');
    
    fireEvent.press(getByText('Criar Conta'));
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Erro de Validação', 'CPF inválido.');
    });
  });

  it('should show error if passwords do not match', async () => {
    const { getByText, getByPlaceholderText } = renderWithContext(<RegisterScreen navigation={mockNavigation} route={{} as any} />);
    
    fireEvent.changeText(getByPlaceholderText('Digite seu nome completo'), 'Test User');
    fireEvent.changeText(getByPlaceholderText('Digite seu CPF (apenas números)'), '00000000000'); // Finge válido pra passar se testar
    fireEvent.changeText(getByPlaceholderText('Digite seu melhor e-mail'), 'test@test.com');
    fireEvent.changeText(getByPlaceholderText('Crie uma senha forte'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Repita sua senha'), 'different');
    
    fireEvent.press(getByText('Criar Conta'));
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Erro de Validação', 'As senhas não coincidem.');
    });
  });
});
