import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';

export interface ProfileData {
  nome: string;
  email: string;
  senhaAtual?: string;
  novaSenha?: string;
}

interface ProfileEditorProps {
  user: any;
  loading: boolean;
  onSaveProfile: (data: ProfileData) => void;
  colors: any;
}

export const ProfileEditor: React.FC<ProfileEditorProps> = ({ user, loading, onSaveProfile, colors }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [nome, setNome] = useState(user?.nome || '');
  const [email, setEmail] = useState(user?.email || '');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');

  // Sync state if user changes externally
  useEffect(() => {
    if (!isEditing) {
      setNome(user?.nome || '');
      setEmail(user?.email || '');
      setSenhaAtual('');
      setNovaSenha('');
    }
  }, [user, isEditing]);

  const handleSave = () => {
    onSaveProfile({
      nome,
      email,
      senhaAtual,
      novaSenha,
    });
  };

  const cancelEdit = () => {
    setNome(user?.nome || '');
    setEmail(user?.email || '');
    setSenhaAtual('');
    setNovaSenha('');
    setIsEditing(false);
  };

  return (
    <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Perfil do Usuário</Text>
        <TouchableOpacity onPress={() => (isEditing ? cancelEdit() : setIsEditing(true))}>
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

          <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 8 }]}>Senha Atual (Necessária para alterar e-mail/senha)</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
            value={senhaAtual}
            onChangeText={setSenhaAtual}
            secureTextEntry
            placeholder="Digite para confirmar alterações sensíveis"
            placeholderTextColor={colors.textSecondary}
          />

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
            onPress={handleSave}
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
  );
};

const styles = StyleSheet.create({
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
    marginBottom: 0,
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
