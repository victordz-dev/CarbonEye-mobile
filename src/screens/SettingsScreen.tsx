import React, { useState } from 'react';
import { ScrollView, TouchableOpacity, Text, Alert, StyleSheet } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { useAuth, useTheme } from '../hooks';
import api from '../services/api';
import { z } from 'zod';
import { ProfileEditor, ProfileData, SystemMenu } from '../components';

const updateProfileSchema = z.object({
  nome: z.string().min(1, 'O nome não pode ficar vazio.'),
  email: z.string().email('E-mail inválido.'),
  senhaAtual: z.string().optional(),
  novaSenha: z.string().optional()
}).superRefine((data, ctx) => {
  const querMudarSenha = (data.novaSenha || '').length > 0;
  if (querMudarSenha && data.novaSenha && data.novaSenha.length < 6) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'A nova senha deve ter no mínimo 6 caracteres.',
      path: ['novaSenha'],
    });
  }
});

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user, login, logout } = useAuth();
  const { isDark, colors, toggleTheme } = useTheme();

  const [loading, setLoading] = useState(false);

  const handleSaveProfile = async (data: ProfileData) => {
    const mudouEmail = data.email.trim() !== user?.email;
    const querMudarSenha = (data.novaSenha || '').trim().length > 0;

    try {
      updateProfileSchema.parse({
        nome: data.nome.trim(),
        email: data.email.trim(),
        senhaAtual: data.senhaAtual || undefined,
        novaSenha: data.novaSenha || undefined
      });
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        Alert.alert('Erro de Validação', e.errors[0].message);
        return;
      }
    }

    if ((mudouEmail || querMudarSenha) && !data.senhaAtual) {
      Alert.alert('Atenção', 'Você precisa informar sua Senha Atual para alterar seu e-mail ou cadastrar uma nova senha.');
      return;
    }

    setLoading(true);
    try {
      const payload: any = { nome: data.nome.trim() };
      
      if (mudouEmail) {
        payload.email = data.email.trim();
        payload.senhaAtual = data.senhaAtual;
      }
      if (querMudarSenha) {
        payload.novaSenha = data.novaSenha;
        payload.senhaAtual = data.senhaAtual;
      }

      const response = await api.put<{ token: string; usuario: any }>('/auth/profile', payload);
      await login(response.data.token, response.data.usuario);
      
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Falha ao atualizar perfil.';
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sair', 'Tem certeza de que deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: () => {
          void logout();
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Excluir Conta',
      'Tem certeza absoluta de que deseja excluir sua conta? Esta ação desativará seu acesso.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir Definitivamente',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await api.delete('/auth/profile');
              Alert.alert('Conta Excluída', 'Sua conta foi desativada com sucesso.');
              await logout();
            } catch (error: any) {
              Alert.alert('Erro', 'Não foi possível excluir a conta no momento.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <ProfileEditor
        user={user}
        loading={loading}
        onSaveProfile={handleSaveProfile}
        colors={colors}
      />

      <SystemMenu
        isDark={isDark}
        toggleTheme={toggleTheme}
        onNavigateHealthCheck={() => navigation.navigate('HealthCheck')}
        onNavigateTestArea={() => navigation.navigate('TestArea')}
        colors={colors}
      />

      <TouchableOpacity
        style={[styles.logoutBtn, { backgroundColor: colors.danger }]}
        onPress={handleLogout}
        disabled={loading}
      >
        <Text style={styles.logoutBtnText}>Sair da Conta</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.logoutBtn, 
          { 
            backgroundColor: 'transparent', 
            borderWidth: 1, 
            borderColor: colors.danger, 
            marginTop: 15,
            elevation: 0,
            shadowOpacity: 0
          }
        ]}
        onPress={handleDeleteAccount}
        disabled={loading}
      >
        <Text style={[styles.logoutBtnText, { color: colors.danger }]}>Excluir Minha Conta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  logoutBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
