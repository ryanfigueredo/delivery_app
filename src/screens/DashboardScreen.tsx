import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Dimensions } from 'react-native';
import { Card, Text, ActivityIndicator, Surface, useTheme } from 'react-native-paper';
import { apiService, DashboardStats } from '../services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 2 cards por linha com padding

export default function DashboardScreen() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
    
    // Atualizar estatísticas a cada 30 segundos
    const interval = setInterval(() => {
      loadStats(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadStats = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      const data = await apiService.getStats();
      setStats(data);
      setError(null);
    } catch (error: any) {
      console.error('Erro ao carregar estatísticas:', error);
      // Capturar mensagem de erro de forma mais robusta
      let errorMessage = 'Erro desconhecido';
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.response?.status) {
        errorMessage = `Erro ${error.response.status}: ${error.response.statusText || 'Rota não encontrada'}`;
      }
      setError(errorMessage);
      if (!silent) {
        setStats(null);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  const formatChange = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    const color = value >= 0 ? theme.colors.success : theme.colors.error;
    return { text: `${sign}${value.toFixed(1)}%`, color };
  };

  if (loading && !stats) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
          Carregando estatísticas...
        </Text>
      </View>
    );
  }

  if (!stats && !loading) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons 
          name="alert-circle-outline" 
          size={48} 
          color={theme.colors.error} 
          style={{ marginBottom: 16 }}
        />
        <Text style={[styles.errorText, { color: theme.colors.error, marginBottom: 8 }]}>
          Erro ao carregar estatísticas
        </Text>
        {error && (
          <Text style={[styles.errorSubtext, { color: theme.colors.onSurfaceVariant }]}>
            {error}
          </Text>
        )}
        <Text 
          style={[styles.retryText, { color: theme.colors.primary, marginTop: 16 }]}
          onPress={() => loadStats()}
        >
          Tentar novamente
        </Text>
      </View>
    );
  }

  const ordersChange = formatChange(stats.week.ordersChange);
  const revenueChange = formatChange(stats.week.revenueChange);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
          Dashboard
        </Text>
        <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Visão geral dos pedidos e estatísticas
        </Text>
      </View>

      {/* KPIs Grid */}
      <View style={styles.kpiGrid}>
        {/* Pedidos Hoje */}
        <Surface style={[styles.kpiCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.kpiContent}>
            <View style={[styles.kpiIconContainer, { backgroundColor: '#3b82f6' + '20' }]}>
              <MaterialCommunityIcons name="file-document-outline" size={24} color="#3b82f6" />
            </View>
            <View style={styles.kpiTextContainer}>
              <Text variant="bodySmall" style={[styles.kpiLabel, { color: theme.colors.onSurfaceVariant }]}>
                Pedidos Hoje
              </Text>
              <Text variant="headlineMedium" style={[styles.kpiValue, { color: theme.colors.onSurface }]}>
                {stats.today.orders}
              </Text>
            </View>
          </View>
        </Surface>

        {/* Receita Hoje */}
        <Surface style={[styles.kpiCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.kpiContent}>
            <View style={[styles.kpiIconContainer, { backgroundColor: '#10b981' + '20' }]}>
              <MaterialCommunityIcons name="currency-usd" size={24} color="#10b981" />
            </View>
            <View style={styles.kpiTextContainer}>
              <Text variant="bodySmall" style={[styles.kpiLabel, { color: theme.colors.onSurfaceVariant }]}>
                Receita Hoje
              </Text>
              <Text variant="headlineSmall" style={[styles.kpiValue, { color: theme.colors.onSurface }]}>
                {stats.today.revenueFormatted}
              </Text>
            </View>
          </View>
        </Surface>

        {/* Pedidos Semana */}
        <Surface style={[styles.kpiCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.kpiContent}>
            <View style={[styles.kpiIconContainer, { backgroundColor: '#8b5cf6' + '20' }]}>
              <MaterialCommunityIcons name="chart-line" size={24} color="#8b5cf6" />
            </View>
            <View style={styles.kpiTextContainer}>
              <Text variant="bodySmall" style={[styles.kpiLabel, { color: theme.colors.onSurfaceVariant }]}>
                Pedidos Semana
              </Text>
              <Text variant="headlineMedium" style={[styles.kpiValue, { color: theme.colors.onSurface }]}>
                {stats.week.orders}
              </Text>
              <Text variant="bodySmall" style={[styles.kpiChange, { color: ordersChange.color }]}>
                {ordersChange.text} vs semana anterior
              </Text>
            </View>
          </View>
        </Surface>

        {/* Receita Semana */}
        <Surface style={[styles.kpiCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.kpiContent}>
            <View style={[styles.kpiIconContainer, { backgroundColor: '#f59e0b' + '20' }]}>
              <MaterialCommunityIcons name="trending-up" size={24} color="#f59e0b" />
            </View>
            <View style={styles.kpiTextContainer}>
              <Text variant="bodySmall" style={[styles.kpiLabel, { color: theme.colors.onSurfaceVariant }]}>
                Receita Semana
              </Text>
              <Text variant="headlineSmall" style={[styles.kpiValue, { color: theme.colors.onSurface }]}>
                {stats.week.revenueFormatted}
              </Text>
              <Text variant="bodySmall" style={[styles.kpiChange, { color: revenueChange.color }]}>
                {revenueChange.text} vs semana anterior
              </Text>
            </View>
          </View>
        </Surface>
      </View>

      {/* Pedidos Pendentes */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.pendingCard}>
            <View style={[styles.pendingIconContainer, { backgroundColor: '#fbbf24' + '20' }]}>
              <MaterialCommunityIcons name="clock-outline" size={32} color="#fbbf24" />
            </View>
            <View style={styles.pendingTextContainer}>
              <Text variant="headlineLarge" style={[styles.pendingValue, { color: theme.colors.onSurface }]}>
                {stats.pendingOrders}
              </Text>
              <Text variant="bodyLarge" style={[styles.pendingLabel, { color: theme.colors.onSurfaceVariant }]}>
                Pedidos Pendentes
              </Text>
              <Text variant="bodySmall" style={[styles.pendingSubtext, { color: theme.colors.onSurfaceVariant }]}>
                Aguardando processamento
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Total Restaurantes (se disponível) */}
      {stats.totalRestaurants !== undefined && (
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.pendingCard}>
              <View style={[styles.pendingIconContainer, { backgroundColor: '#6366f1' + '20' }]}>
                <MaterialCommunityIcons name="store" size={32} color="#6366f1" />
              </View>
              <View style={styles.pendingTextContainer}>
                <Text variant="headlineLarge" style={[styles.pendingValue, { color: theme.colors.onSurface }]}>
                  {stats.totalRestaurants}
                </Text>
                <Text variant="bodyLarge" style={[styles.pendingLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Restaurantes Ativos
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Estatísticas Diárias */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Pedidos por Dia da Semana
          </Text>
          <View style={styles.dailyStatsContainer}>
            {stats.dailyStats.map((day, index) => (
              <View key={index} style={styles.dailyStatItem}>
                <Text variant="bodySmall" style={[styles.dailyStatDay, { color: theme.colors.onSurfaceVariant }]}>
                  {day.day.substring(0, 3)}
                </Text>
                <View style={[styles.dailyStatBar, { backgroundColor: theme.colors.primary + '20' }]}>
                  <View
                    style={[
                      styles.dailyStatBarFill,
                      {
                        height: `${Math.max((day.orders / Math.max(...stats.dailyStats.map(d => d.orders))) * 100, 5)}%`,
                        backgroundColor: theme.colors.primary,
                      },
                    ]}
                  />
                </View>
                <Text variant="bodySmall" style={[styles.dailyStatValue, { color: theme.colors.onSurface }]}>
                  {day.orders}
                </Text>
                <Text variant="bodySmall" style={[styles.dailyStatRevenue, { color: theme.colors.onSurfaceVariant }]}>
                  {day.revenue > 0 ? `R$ ${(day.revenue / 1000).toFixed(1)}k` : '-'}
                </Text>
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Espaço no final */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    marginTop: 4,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    paddingTop: 8,
  },
  kpiCard: {
    width: cardWidth,
    margin: 4,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  kpiContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kpiIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  kpiTextContainer: {
    flex: 1,
  },
  kpiLabel: {
    marginBottom: 4,
  },
  kpiValue: {
    fontWeight: 'bold',
  },
  kpiChange: {
    marginTop: 2,
    fontSize: 11,
  },
  card: {
    margin: 16,
    marginTop: 8,
    borderRadius: 12,
    elevation: 2,
  },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  pendingTextContainer: {
    flex: 1,
  },
  pendingValue: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  pendingLabel: {
    marginBottom: 2,
  },
  pendingSubtext: {
    fontSize: 12,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  dailyStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    minHeight: 200,
  },
  dailyStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  dailyStatDay: {
    marginBottom: 8,
    fontSize: 11,
  },
  dailyStatBar: {
    width: 30,
    height: 120,
    borderRadius: 4,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  dailyStatBarFill: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
  dailyStatValue: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  dailyStatRevenue: {
    fontSize: 10,
  },
  bottomSpacer: {
    height: 16,
  },
});
