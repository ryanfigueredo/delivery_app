import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet, Alert, RefreshControl, Linking, Platform } from 'react-native';
import { Card, Text, ActivityIndicator, FAB, Badge, Button } from 'react-native-paper';
import { apiService, PriorityConversation } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import * as Notifications from 'expo-notifications';

// Configurar comportamento de notificações (apenas se disponível)
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch (error) {
  // Ignorar erro se notificações não estiverem disponíveis (Expo Go)
  console.log('Notificações não disponíveis no Expo Go');
}

export default function SupportScreen() {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [conversations, setConversations] = useState<PriorityConversation[]>([]);
  const [notificationPermission, setNotificationPermission] = useState(false);
  const previousCountRef = useRef<number>(0);
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    if (isAuthenticated) {
      checkNotificationPermission();
      loadConversations();
      
      // Verificar novas conversas a cada 10 segundos (mais frequente)
      const interval = setInterval(() => {
        loadConversations(true); // silent refresh
      }, 10000);

    // Listener para quando a notificação é recebida (apenas se disponível)
    try {
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        console.log('Notificação recebida:', notification);
      });

      // Listener para quando o usuário toca na notificação
      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Usuário tocou na notificação:', response);
      });
    } catch (error) {
      // Ignorar erro se notificações não estiverem disponíveis
      console.log('Listeners de notificação não disponíveis');
    }

      return () => {
        clearInterval(interval);
        try {
          if (notificationListener.current) {
            Notifications.removeNotificationSubscription(notificationListener.current);
          }
          if (responseListener.current) {
            Notifications.removeNotificationSubscription(responseListener.current);
          }
        } catch (error) {
          // Ignorar erro ao remover listeners
        }
      };
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const checkNotificationPermission = async () => {
    try {
      // Verificar se notificações estão disponíveis (não funciona no Expo Go)
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        try {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        } catch (permError) {
          // Ignorar erro se notificações não estiverem disponíveis
          console.log('Notificações não disponíveis (Expo Go)');
          setNotificationPermission(false);
          return;
        }
      }
      
      setNotificationPermission(finalStatus === 'granted');
      
      if (finalStatus !== 'granted') {
        // Não mostrar alerta no Expo Go
        console.log('Permissão de notificação não concedida');
      }
    } catch (error) {
      // Ignorar erros de notificação no Expo Go
      console.log('Notificações não disponíveis:', error);
      setNotificationPermission(false);
    }
  };

  const loadConversations = async (silent = false) => {
    if (!isAuthenticated) {
      return;
    }
    
    try {
      if (!silent) setLoading(true);
      const data = await apiService.getPriorityConversations();
      const previousCount = previousCountRef.current;
      const currentCount = data.length;
      
      // Detectar novas conversas
      if (currentCount > previousCount && previousCount > 0 && notificationPermission) {
        const newCount = currentCount - previousCount;
        await sendNotificationForNewConversations(data, newCount);
      }
      
      setConversations(data);
      previousCountRef.current = currentCount;
    } catch (error: any) {
      // Não mostrar alerta se for erro 401 (não autenticado) - o interceptor já trata
      if (!silent && error.response?.status !== 401) {
        Alert.alert('Erro', `Erro ao carregar conversas: ${error.message}`);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const sendNotificationForNewConversations = async (
    conversations: PriorityConversation[],
    newCount: number
  ) => {
    try {
      // Verificar se notificações estão disponíveis
      if (!notificationPermission) {
        return;
      }

      const urgentConversations = conversations.filter(conv => conv.waitTime >= 5);
      const hasUrgent = urgentConversations.length > 0;

      let title = 'Novo Cliente Pediu Atendimento';
      let body = `${newCount} novo(s) cliente(s) aguardando atendimento`;

      if (hasUrgent) {
        title = 'ATENDIMENTO URGENTE';
        body = `${urgentConversations.length} cliente(s) aguardando há mais de 5 minutos!`;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          priority: hasUrgent 
            ? Notifications.AndroidNotificationPriority.HIGH 
            : Notifications.AndroidNotificationPriority.DEFAULT,
          data: {
            screen: 'Support',
            conversationsCount: conversations.length,
          },
        },
        trigger: null, // Enviar imediatamente
      });
    } catch (error) {
      // Ignorar erros de notificação (comum no Expo Go)
      console.log('Notificação não disponível:', error);
    }
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
                Nenhuma conversa prioritária no momento
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
                Conversas Prioritárias
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
                        Aguardando: {formatWaitTime(conv.waitTime)}
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
    padding: 8,
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
    marginBottom: 8,
    elevation: 4,
    borderRadius: 8,
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
