import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, Card, useTheme, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen() {
  const theme = useTheme();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await login(username.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <View style={[styles.logoCircle, { backgroundColor: theme.colors.primary + '20' }]}>
            <MaterialCommunityIcons
              name="store"
              size={64}
              color={theme.colors.primary}
            />
          </View>
          <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
            Pedidos Express
          </Text>
          <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Sistema de Gerenciamento
          </Text>
        </View>

        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleLarge" style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
              Entrar
            </Text>

            {error ? (
              <View style={[styles.errorContainer, { backgroundColor: theme.colors.errorContainer }]}>
                <MaterialCommunityIcons
                  name="alert-circle"
                  size={20}
                  color={theme.colors.error}
                  style={styles.errorIcon}
                />
                <Text style={[styles.errorText, { color: theme.colors.onErrorContainer }]}>
                  {error}
                </Text>
              </View>
            ) : null}

            <TextInput
              label="Usuário"
              value={username}
              onChangeText={setUsername}
              mode="outlined"
              autoCapitalize="none"
              autoCorrect={false}
              disabled={loading}
              style={styles.input}
              left={<TextInput.Icon icon="account" />}
            />

            <TextInput
              label="Senha"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              disabled={loading}
              style={styles.input}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />

            <Button
              mode="contained"
              onPress={handleLogin}
              disabled={loading || !username.trim() || !password.trim()}
              style={styles.button}
              contentStyle={styles.buttonContent}
              loading={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </Card.Content>
        </Card>

        <View style={styles.footer}>
          <Text variant="bodySmall" style={[styles.footerText, { color: theme.colors.onSurfaceVariant }]}>
            Sistema desenvolvido por{' '}
            <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
              dmtn.com.br
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  card: {
    elevation: 4,
    borderRadius: 16,
  },
  cardContent: {
    padding: 24,
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorIcon: {
    marginRight: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    textAlign: 'center',
  },
});
