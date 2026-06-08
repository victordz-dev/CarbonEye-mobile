import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { useAuth, useTheme } from '../hooks';
import api from '../services/api';
import { z } from 'zod';

const updateProfileSchema = z.object({
  nome: z.string().min(1, 'O nome não pode ficar vazio.'),
  email: z.string().email('E-mail inválido.'),
  senhaAtual: z.string().optional(),
  novaSenha: z.string().optional()
}).superRefine((data, ctx) => {
  const mudouEmail = data.email !== undefined; // Lógica será feita fora para checar se mudou de fato
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

  const [isEditing, setIsEditing] = useState(false);
  const [nome, setNome] = useState(user?.nome || '');
  const [email, setEmail] = useState(user?.email || '');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSaveProfile = async () => {
    const mudouEmail = email.trim() !== user?.email;
    const querMudarSenha = novaSenha.trim().length > 0;

    try {
      updateProfileSchema.parse({
        nome: nome.trim(),
        email: email.trim(),
        senhaAtual: senhaAtual || undefined,
        novaSenha: novaSenha || undefined
      });
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        Alert.alert('Erro de Validação', e.errors[0].message);
        return;
      }
    }

    if ((mudouEmail || querMudarSenha) && !senhaAtual) {
      Alert.alert('Atenção', 'Você precisa informar sua Senha Atual para alterar seu e-mail ou cadastrar uma nova senha.');
      return;
    }

    setLoading(true);
    try {
      const payload: any = { nome: nome.trim() };
      
      if (mudouEmail) {
        payload.email = email.trim();
        payload.senhaAtual = senhaAtual;
      }
      if (querMudarSenha) {
        payload.novaSenha = novaSenha;
        payload.senhaAtual = senhaAtual;
      }

      const response = await api.put<{ token: string; usuario: any }>('/auth/profile', payload);
      
      await login(response.data.token, response.data.usuario);
      
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
      setIsEditing(false);
      setSenhaAtual('');
      setNovaSenha('');
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
      {/* Perfil */}
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Perfil do Usuário</Text>
          <TouchableOpacity onPress={() => {
            if (isEditing) {
              setNome(user?.nome || '');
              setEmail(user?.email || '');
              setSenhaAtual('');
              setNovaSenha('');
            }
            setIsEditing(!isEditing);
          }}>
            <Text style={{ color: colors.primary, fontWeight: 'bold' }}>{isEditing ? 'Cancelar' : 'Editar'}</Text>
          </TouchableOpacity>
        </View>

        {isEditing ? (
          <View>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Nome</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              value={nome}
              onChangeText={setNome}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>E-mail</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <>
              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 8 }]}>Senha Atual (Necessária para alterar e-mail/senha)</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                value={senhaAtual}
                onChangeText={setSenhaAtual}
                secureTextEntry
                placeholder="Digite para confirmar alterações sensíveis"
                placeholderTextColor={colors.textSecondary}
              />
            </>

            <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 8 }]}>Nova Senha (Opcional)</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              value={novaSenha}
              onChangeText={setNovaSenha}
              secureTextEntry
              placeholder="Digite apenas se quiser mudar"
              placeholderTextColor={colors.textSecondary}
            />

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              onPress={handleSaveProfile}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Salvar Alterações</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.profileRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Nome:</Text>
              <Text style={[styles.value, { color: colors.text }]}>{user?.nome || 'Não disponível'}</Text>
            </View>
            <View style={styles.profileRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>E-mail:</Text>
              <Text style={[styles.value, { color: colors.text }]}>{user?.email || 'Não disponível'}</Text>
            </View>
            <View style={styles.profileRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>CPF:</Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {user?.cpf ? user.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : 'Não disponível'}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Preferências */}
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferências</Text>
        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: colors.text }]}>Modo Escuro (Dark Mode)</Text>
          <Switch value={isDark} onValueChange={toggleTheme} />
        </View>
      </View>

      {/* Diagnóstico de Sistema */}
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Sistema & Conectividade</Text>
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => navigation.navigate('HealthCheck')}
        >
          <Text style={[styles.menuLabel, { color: colors.text }]}>Disponibilidade das APIs</Text>
          <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Verificar ⚡</Text>
        </TouchableOpacity>
        
        <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 12 }} />
        
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => navigation.navigate('TestArea')}
        >
          <Text style={[styles.menuLabel, { color: colors.text }]}>Área de Testes (Alertas Mock)</Text>
          <Text style={{ color: colors.danger, fontWeight: 'bold' }}>Debug 🧪</Text>
        </TouchableOpacity>
      </View>

      {/* Ações */}
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
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '600',
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
  inputLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  saveBtn: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
