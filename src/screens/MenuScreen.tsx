import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, RefreshControl } from 'react-native';
import { Card, Text, ActivityIndicator, FAB, Button, TextInput, Switch, Portal, Modal } from 'react-native-paper';
import { apiService, MenuItem } from '../services/api';

export default function MenuScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editAvailable, setEditAvailable] = useState(true);

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      setLoading(true);
      const data = await apiService.getMenu();
      setMenuItems(data);
    } catch (error: any) {
      Alert.alert('Erro', `Erro ao carregar cardápio: ${error.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMenu();
  };

  const handleItemPress = (item: MenuItem) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditPrice(item.price.toString());
    setEditAvailable(item.available);
    setEditModalVisible(true);
  };

  const handleSaveItem = async () => {
    if (!editingItem) return;

    const price = parseFloat(editPrice);
    if (isNaN(price) || price < 0) {
      Alert.alert('Erro', 'Preço inválido');
      return;
    }

    try {
      await apiService.updateMenuItem({
        id: editingItem.id,
        name: editName,
        price: price,
        available: editAvailable,
      });
      setEditModalVisible(false);
      Alert.alert('Sucesso', 'Item atualizado!');
      loadMenu();
    } catch (error: any) {
      Alert.alert('Erro', `Erro ao atualizar item: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Carregando cardápio...</Text>
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
        {menuItems.length === 0 ? (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.emptyText}>Nenhum item no cardápio</Text>
            </Card.Content>
          </Card>
        ) : (
          menuItems.map((item) => (
            <Card
              key={item.id}
              style={styles.card}
              onPress={() => handleItemPress(item)}
            >
              <Card.Content>
                <View style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPrice}>
                      R$ {item.price.toFixed(2)}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.itemAvailable,
                      {
                        color: item.available ? '#4CAF50' : '#f44336',
                      },
                    ]}
                  >
                    {item.available ? 'Disponível' : 'Indisponível'}
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
        onPress={loadMenu}
        label="Atualizar"
      />

      <Portal>
        <Modal
          visible={editModalVisible}
          onDismiss={() => setEditModalVisible(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text style={styles.modalTitle}>Editar Item</Text>

          <TextInput
            label="Nome"
            value={editName}
            onChangeText={setEditName}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Preço"
            value={editPrice}
            onChangeText={setEditPrice}
            mode="outlined"
            keyboardType="decimal-pad"
            style={styles.input}
          />

          <View style={styles.switchContainer}>
            <Text>Disponível:</Text>
            <Switch
              value={editAvailable}
              onValueChange={setEditAvailable}
              color="#4CAF50"
            />
          </View>

          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setEditModalVisible(false)}
              style={styles.modalButton}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={handleSaveItem}
              buttonColor="#4CAF50"
              style={styles.modalButton}
            >
              Salvar
            </Button>
          </View>
        </Modal>
      </Portal>
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
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemPrice: {
    fontSize: 14,
    marginTop: 4,
  },
  itemAvailable: {
    fontSize: 12,
    marginLeft: 16,
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
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  modalButton: {
    marginLeft: 8,
  },
});
