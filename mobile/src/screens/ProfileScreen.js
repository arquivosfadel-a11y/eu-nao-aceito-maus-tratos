import React from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, Alert
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Deseja realmente sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: logout }
      ]
    );
  };

  const roleLabel = {
    citizen: '👤 Cidadão',
    protector: '🛡️ Protetor',
    validator: '✅ Validador',
    admin: '⚙️ Administrador',
    secretary: '🛡️ Protetor',
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.[0]?.toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{roleLabel[user?.role] || user?.role}</Text>
        </View>
      </View>

      <View style={styles.info}>
        {user?.city && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>🏙️ Cidade</Text>
            <Text style={styles.infoValue}>{user.city.name} - {user.city.state}</Text>
          </View>
        )}
        {user?.phone && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📱 Telefone</Text>
            <Text style={styles.infoValue}>{user.phone}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Sair da conta</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Eu Não Aceito Maus Tratos v1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#1B4332',
    padding: 30,
    paddingTop: 60,
    alignItems: 'center'
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12
  },
  avatarText: { color: '#FFFFFF', fontSize: 32, fontWeight: 'bold' },
  name: { color: '#FFFFFF', fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  email: { color: '#A7F3D0', fontSize: 14, marginBottom: 12 },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20
  },
  roleText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  info: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 16
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  infoLabel: { color: '#6B7280', fontSize: 14 },
  infoValue: { color: '#111827', fontSize: 14, fontWeight: '600' },
  logoutButton: {
    backgroundColor: '#FEE2E2',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  logoutText: { color: '#EF4444', fontSize: 16, fontWeight: '600' },
  version: { textAlign: 'center', color: '#9CA3AF', fontSize: 12, marginTop: 8 },
  container: { flex: 1, backgroundColor: '#F0F7F4' },
});