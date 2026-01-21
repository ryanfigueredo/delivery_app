import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, RefreshControl, Linking } from 'react-native';
import { Card, Text, ActivityIndicator, FAB, Badge, Button } from 'react-native-paper';
import { apiService, PriorityConversation } from '../services/api';
// Notificações serão implementadas quando expo-notifications estiver instalado
// import * as Notifications from 'expo-notifications';

export default function SupportScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [conversations, setConversations] = useState<PriorityConversation[]>([]);
  const [notificationPermission, setNotificationPermission] = useState(false);

  useEffect(() => {
    checkNotificationPermission();
    loadConversations();
    
    // Verificar novas conversas a cada 30 segundos
    const interval = setInterval(() => {
      loadConversations(true); // silent refresh
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const checkNotificationPermission = async () => {
    // TODO: Implementar quando expo-notifications estiver instalado
    // try {
    //   const { status } = await Notifications.getPermissionsAsync();
    //   if (status !== 'granted') {
    //     const { status: newStatus } = await Notifications.requestPermissionsAsync();
    //     setNotificationPermission(newStatus === 'granted');
    //   } else {
    //     setNotificationPermission(true);
    //   }
    // } catch (error) {
    //   console.error('Erro ao verificar permissão de notificação:', error);
    // }
    setNotificationPermission(false); // Temporário
  };

  const loadConversations = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await apiService.getPriorityConversations();
      setConversations(data);
      
      // Se houver novas conversas, enviar notificação
      if (data.length > 0 && notificationPermission) {
        sendNotificationIfNeeded(data);
      }
    } catch (error: any) {
      if (!silent) {
        Alert.alert('Erro', `Erro ao carregar conversas: ${error.message}`);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const sendNotificationIfNeeded = async (newConversations: PriorityConversation[]) => {
    // TODO: Implementar quando expo-notifications estiver instalado
    // try {
    //   const urgentConversations = newConversations.filter(conv => conv.waitTime >= 5);
    //   if (urgentConversations.length > 0) {
    //     await Notifications.scheduleNotificationAsync({
    //       content: {
    //         title: '🔔 Atendimento Necessário',
    //         body: `${urgentConversations.length} cliente(s) aguardando atendimento há mais de 5 minutos`,
    //         sound: true,
    //         priority: Notifications.AndroidNotificationPriority.HIGH,
    //       },
    //       trigger: null,
    //     });
    //   }
    // } catch (error) {
    //   console.error('Erro ao enviar notificação:', error);
    // }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const openWhatsApp = async (whatsappUrl: string, phoneFormatted: string) => {
    try {
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        Alert.alert('Erro', 'Não foi possível abrir o WhatsApp. Verifique se está instalado.');
      }
    } catch (error: any) {
      Alert.alert('Erro', `Erro ao abrir WhatsApp: ${error.message}`);
    }
  };

  const formatWaitTime = (minutes: number): string => {
    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Carregando conversas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {conversations.length === 0 ? (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.emptyText}>
                ✅ Nenhuma conversa prioritária no momento
              </Text>
              <Text style={styles.emptySubtext}>
                Clientes que pedirem atendimento aparecerão aqui
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>
                🔔 Conversas Prioritárias
              </Text>
              <Badge style={styles.badge}>{conversations.length}</Badge>
            </View>

            {conversations.map((conv, index) => (
              <Card
                key={conv.phone}
                style={[
                  styles.card,
                  conv.waitTime >= 10 && styles.cardUrgent
                ]}
              >
                <Card.Content>
                  <View style={styles.conversationHeader}>
                    <View style={styles.conversationInfo}>
                      <Text style={styles.phoneText}>{conv.phoneFormatted}</Text>
                      <Text style={styles.waitTimeText}>
                        ⏱️ Aguardando: {formatWaitTime(conv.waitTime)}
                      </Text>
                    </View>
                    {conv.waitTime >= 10 && (
                      <Badge style={styles.urgentBadge}>URGENTE</Badge>
                    )}
                  </View>

                  <Button
                    mode="contained"
                    icon="whatsapp"
                    onPress={() => openWhatsApp(conv.whatsappUrl, conv.phoneFormatted)}
                    style={styles.whatsappButton}
                    contentStyle={styles.buttonContent}
                  >
                    Abrir WhatsApp
                  </Button>
                </Card.Content>
              </Card>
            ))}
          </>
        )}
      </ScrollView>

      <FAB
        icon="refresh"
        style={styles.fab}
        onPress={loadConversations}
        label="Atualizar"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 8,
  },
  badge: {
    backgroundColor: '#FF5722',
  },
  card: {
    marginBottom: 12,
  },
  cardUrgent: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF5722',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  conversationInfo: {
    flex: 1,
  },
  phoneText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  waitTimeText: {
    fontSize: 14,
    color: '#666',
  },
  urgentBadge: {
    backgroundColor: '#FF5722',
    marginLeft: 8,
  },
  whatsappButton: {
    marginTop: 8,
    backgroundColor: '#25D366',
  },
  buttonContent: {
    paddingVertical: 4,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#4CAF50',
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#4CAF50',
  },
});
