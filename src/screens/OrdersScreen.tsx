import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, RefreshControl } from 'react-native';
import { Button, Card, Text, ActivityIndicator, FAB } from 'react-native-paper';
import { apiService, Order } from '../services/api';
import { printerService } from '../services/printer';

export default function OrdersScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    printerService.initialize();
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAllOrders();
      setOrders(data);
    } catch (error: any) {
      Alert.alert('Erro', `Erro ao carregar pedidos: ${error.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const handleOrderPress = (order: Order) => {
    if (order.status === 'pending') {
      // Se for maquininha, pode imprimir diretamente
      // Se for mobile, envia comando para maquininha
      Alert.alert(
        'Imprimir pedido?',
        `Pedido ${order.display_id || order.id}\nCliente: ${order.customer_name}`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Imprimir',
            onPress: () => printOrder(order),
          },
        ],
      );
    } else if (order.status === 'printed' && order.order_type === 'delivery') {
      Alert.alert(
        '🚚 Pedido saindo para entrega',
        `Pedido: ${order.display_id || order.id}\nCliente: ${order.customer_name}\n\nO bot vai enviar uma mensagem automática para o cliente informando que o pedido está a caminho!`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Confirmar',
            onPress: () => markAsOutForDelivery(order.id),
          },
        ]
      );
    } else {
      showOrderDetails(order);
    }
  };

  const printOrder = async (order: Order) => {
    try {
      const success = await printerService.printOrder(order);
      if (success) {
        Alert.alert('Sucesso', 'Pedido enviado para impressão!');
        loadOrders();
      } else {
        Alert.alert('Erro', 'Não foi possível imprimir o pedido');
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao imprimir pedido');
    }
  };

  const markAsOutForDelivery = async (orderId: string) => {
    try {
      // Marcar como saiu para entrega
      await apiService.markOrderOutForDelivery(orderId);
      
      // Enviar notificação via bot WhatsApp
      try {
        await apiService.notifyDelivery(orderId);
        Alert.alert(
          '✅ Sucesso!',
          'Pedido marcado como saiu para entrega!\n\n📱 Mensagem enviada ao cliente via WhatsApp.'
        );
      } catch (notifyError: any) {
        Alert.alert(
          '⚠️ Atenção',
          'Pedido marcado como saiu para entrega!\n\nHouve um problema ao enviar a mensagem, mas o pedido foi atualizado.'
        );
      }
      
      loadOrders();
    } catch (error: any) {
      Alert.alert('Erro', `Erro ao marcar pedido: ${error.message}`);
    }
  };

  const showOrderDetails = (order: Order) => {
    const itemsText = order.items
      .map((item) => `${item.quantity}x ${item.name} - R$ ${(item.price * item.quantity).toFixed(2)}`)
      .join('\n');

    Alert.alert(
      `Pedido ${order.display_id || order.id}`,
      `Cliente: ${order.customer_name}\n` +
        `Telefone: ${order.customer_phone}\n` +
        `Status: ${getStatusText(order.status)}\n` +
        `Tipo: ${order.order_type || 'restaurante'}\n` +
        (order.delivery_address ? `Endereço: ${order.delivery_address}\n` : '') +
        `\nItens:\n${itemsText}\n\n` +
        `Total: R$ ${order.total_price.toFixed(2)}`
    );
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '⏳ Pendente';
      case 'printed':
        return '✅ Impresso';
      case 'finished':
        return '✅ Finalizado';
      case 'out_for_delivery':
        return '🚚 Saiu para entrega';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Carregando pedidos...</Text>
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
        {orders.length === 0 ? (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.emptyText}>Nenhum pedido encontrado</Text>
            </Card.Content>
          </Card>
        ) : (
          orders.map((order) => (
            <Card
              key={order.id}
              style={styles.card}
              onPress={() => handleOrderPress(order)}
            >
              <Card.Content>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderId}>
                    {order.display_id || `#${order.daily_sequence?.toString().padStart(3, '0') || '000'}`}
                  </Text>
                  <Text style={styles.orderStatus}>
                    {getStatusText(order.status)}
                  </Text>
                </View>
                <Text style={styles.customerName}>{order.customer_name}</Text>
                <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
                <Text style={styles.orderTotal}>
                  R$ {order.total_price.toFixed(2)}
                </Text>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      <FAB
        icon="refresh"
        style={styles.fab}
        onPress={loadOrders}
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
  card: {
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  orderStatus: {
    fontSize: 14,
  },
  customerName: {
    fontSize: 16,
    marginTop: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 8,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
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
