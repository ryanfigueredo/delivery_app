import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet, Alert, RefreshControl } from 'react-native';
import { Button, Card, Text, ActivityIndicator, FAB } from 'react-native-paper';
import { apiService, Order } from '../services/api';
import { printerService } from '../services/printer';
import { bluetoothPrinterService } from '../services/bluetoothPrinter';

export default function OrdersScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const previousOrderIdsRef = useRef<Set<string>>(new Set());
  const printingOrdersRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    printerService.initialize();
    bluetoothPrinterService.initialize();
    loadOrders();
    
    // Atualizar pedidos a cada 5 segundos (mais frequente para detectar novos pedidos)
    const interval = setInterval(() => {
      loadOrders(true, 1); // silent refresh, sempre página 1
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadOrders = async (silent = false, pageNum = 1) => {
    try {
      if (!silent) setLoading(true);
      const data = await apiService.getAllOrders(pageNum, 20);
      // Ordenar por data (mais recentes primeiro)
      const sortedData = data.orders.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      // Detectar novos pedidos pendentes e imprimir automaticamente
      if (pageNum === 1) {
        detectAndPrintNewOrders(sortedData);
        setOrders(sortedData);
      } else {
        setOrders(prev => [...prev, ...sortedData]);
      }
      
      setHasMore(data.pagination.hasMore);
      setPage(pageNum);
    } catch (error: any) {
      if (!silent) {
        Alert.alert('Erro', `Erro ao carregar pedidos: ${error.message}`);
      }
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Detecta novos pedidos pendentes e imprime automaticamente
   */
  const detectAndPrintNewOrders = async (currentOrders: Order[]) => {
    try {
      const currentOrderIds = new Set(currentOrders.map(o => o.id));
      
      // Encontrar novos pedidos (não estavam na lista anterior)
      const newOrders = currentOrders.filter(order => 
        !previousOrderIdsRef.current.has(order.id) &&
        order.status === 'pending' &&
        !printingOrdersRef.current.has(order.id)
      );
      
      // Atualizar referência
      previousOrderIdsRef.current = currentOrderIds;
      
      // Imprimir novos pedidos automaticamente
      for (const order of newOrders) {
        if (bluetoothPrinterService.hasPrinter()) {
          printingOrdersRef.current.add(order.id);
          console.log('🖨️ Novo pedido detectado, imprimindo automaticamente:', order.id);
          
          // Imprimir em background (não bloquear UI)
          printOrderAutomatically(order).catch(error => {
            console.error('Erro ao imprimir pedido automaticamente:', error);
            printingOrdersRef.current.delete(order.id);
          });
        }
      }
    } catch (error) {
      console.error('Erro ao detectar novos pedidos:', error);
    }
  };

  /**
   * Imprime pedido automaticamente (sem mostrar alerta)
   */
  const printOrderAutomatically = async (order: Order): Promise<void> => {
    try {
      const success = await bluetoothPrinterService.printOrder(order);
      if (success) {
        console.log('✅ Pedido impresso automaticamente:', order.id);
        // Atualizar status do pedido na API (marcar como impresso)
        // Isso será feito automaticamente quando o pedido for processado
      }
    } catch (error: any) {
      console.error('Erro ao imprimir automaticamente:', error);
      // Não mostrar alerta para impressão automática (só logar)
    } finally {
      printingOrdersRef.current.delete(order.id);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    loadOrders(false, 1);
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
        'Pedido saindo para entrega',
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
      // Tentar usar impressora Bluetooth primeiro
      if (bluetoothPrinterService.hasPrinter()) {
        const success = await bluetoothPrinterService.printOrder(order);
        if (success) {
          Alert.alert('Sucesso', 'Pedido impresso com sucesso!');
          loadOrders();
          return;
        }
      }
      
      // Fallback: usar serviço antigo (para compatibilidade)
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
          'Sucesso!',
          'Pedido marcado como saiu para entrega!\n\nMensagem enviada ao cliente via WhatsApp.'
        );
      } catch (notifyError: any) {
        Alert.alert(
          'Atenção',
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
      .map((item) => {
        const itemPrice = typeof item.price === 'number' ? item.price : parseFloat(item.price?.toString() || '0');
        const quantity = item.quantity || 1;
        return `${quantity}x ${item.name} - R$ ${(itemPrice * quantity).toFixed(2).replace('.', ',')}`;
      })
      .join('\n');

    Alert.alert(
      `Pedido ${order.display_id || order.id}`,
      `Cliente: ${order.customer_name}\n` +
        `Telefone: ${order.customer_phone}\n` +
        `Status: ${getStatusText(order.status)}\n` +
        `Tipo: ${order.order_type || 'restaurante'}\n` +
        (order.delivery_address ? `Endereço: ${order.delivery_address}\n` : '') +
        `\nItens:\n${itemsText}\n\n` +
        `Total: R$ ${formatPrice(order.total_price)}`
    );
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'printed':
        return 'Impresso';
      case 'finished':
        return 'Finalizado';
      case 'out_for_delivery':
        return 'Saiu para entrega';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9800'; // Laranja
      case 'printed':
        return '#2196F3'; // Azul
      case 'finished':
        return '#4CAF50'; // Verde
      case 'out_for_delivery':
        return '#9C27B0'; // Roxo
      default:
        return '#666';
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

  const formatPrice = (price: any): string => {
    if (price === null || price === undefined) {
      return '0,00';
    }
    
    let numPrice: number;
    if (typeof price === 'number') {
      numPrice = price;
    } else if (typeof price === 'string') {
      numPrice = parseFloat(price);
    } else if (typeof price === 'object' && price !== null && 'toNumber' in price) {
      numPrice = (price as any).toNumber();
    } else {
      numPrice = 0;
    }
    
    if (isNaN(numPrice) || !isFinite(numPrice)) {
      return '0,00';
    }
    
    return numPrice.toFixed(2).replace('.', ',');
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
              <Text style={styles.emptySubtext}>
                Os pedidos do WhatsApp aparecerão aqui automaticamente
              </Text>
            </Card.Content>
          </Card>
        ) : (
          orders.map((order) => (
            <Card
              key={order.id}
              style={[
                styles.card,
                order.status === 'pending' && styles.cardPending,
              ]}
              onPress={() => handleOrderPress(order)}
            >
              <Card.Content>
                <View style={styles.orderHeader}>
                  <View style={styles.orderIdContainer}>
                    <Text style={styles.orderId}>
                      {order.display_id || `#${order.daily_sequence?.toString().padStart(3, '0') || '000'}`}
                    </Text>
                    {order.order_type === 'delivery' && (
                      <Text style={styles.deliveryBadge}>DELIVERY</Text>
                    )}
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(order.status) },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {getStatusText(order.status)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.customerName}>{order.customer_name}</Text>
                <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
                {order.items && order.items.length > 0 && (
                  <View style={styles.itemsPreview}>
                    <Text style={styles.itemsText} numberOfLines={2}>
                      {order.items
                        .slice(0, 2)
                        .map((item) => `${item.quantity}x ${item.name}`)
                        .join(', ')}
                      {order.items.length > 2 && ` +${order.items.length - 2} mais`}
                    </Text>
                  </View>
                )}
                <View style={styles.totalContainer}>
                  <Text style={styles.orderTotal}>
                    R$ {formatPrice(order.total_price)}
                  </Text>
                </View>
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
    backgroundColor: '#f5f5f5',
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
    color: '#666',
  },
  card: {
    marginBottom: 8,
    elevation: 4,
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  cardPending: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderIdContainer: {
    flex: 1,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  deliveryBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#9C27B0',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  itemsPreview: {
    marginTop: 8,
    marginBottom: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  itemsText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  totalContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50', // holo_green_dark
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
    fontSize: 14,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#4CAF50',
  },
});
