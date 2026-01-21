import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Button, Switch, TextInput, Text, Card, ActivityIndicator } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { apiService, StoreStatus } from '../services/api';

export default function StoreScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [nextOpenTime, setNextOpenTime] = useState<string | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());

  useEffect(() => {
    loadStoreStatus();
  }, []);

  const loadStoreStatus = async () => {
    try {
      setLoading(true);
      const status = await apiService.getStoreStatus();
      setIsOpen(status.isOpen);
      setNextOpenTime(status.nextOpenTime);
      setCustomMessage(status.message || '');
    } catch (error: any) {
      Alert.alert('Erro', `Erro ao carregar status: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeChange = (event: any, date?: Date) => {
    setShowTimePicker(false);
    if (date) {
      setSelectedTime(date);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      setNextOpenTime(`${hours}:${minutes}`);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await apiService.updateStoreStatus({
        isOpen,
        nextOpenTime: isOpen ? null : nextOpenTime,
        message: customMessage || null,
      });
      Alert.alert('Sucesso', 'Status atualizado com sucesso!');
      loadStoreStatus();
    } catch (error: any) {
      Alert.alert('Erro', `Erro ao salvar: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.statusContainer}>
            <Switch
              value={isOpen}
              onValueChange={setIsOpen}
              color="#4CAF50"
            />
            <Text
              style={[
                styles.statusText,
                { color: isOpen ? '#4CAF50' : '#f44336' },
              ]}
            >
              {isOpen ? '🟢 LOJA ABERTA' : '🔴 LOJA FECHADA'}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {!isOpen && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.label}>Horário de abertura:</Text>
            <Button
              mode="outlined"
              onPress={() => setShowTimePicker(true)}
              style={styles.timeButton}
            >
              {nextOpenTime || 'Definir horário'}
            </Button>

            {showTimePicker && (
              <DateTimePicker
                value={selectedTime}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={handleTimeChange}
              />
            )}
          </Card.Content>
        </Card>
      )}

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.label}>Mensagem customizada (opcional):</Text>
          <TextInput
            mode="outlined"
            placeholder="Ex: Voltamos às 18h!"
            value={customMessage}
            onChangeText={setCustomMessage}
            multiline
            numberOfLines={3}
            style={styles.messageInput}
          />
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={handleSave}
        loading={saving}
        disabled={saving}
        style={styles.saveButton}
        buttonColor="#4CAF50"
      >
        Salvar Status
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
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
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statusText: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  timeButton: {
    marginTop: 8,
  },
  messageInput: {
    marginTop: 8,
  },
  saveButton: {
    marginTop: 8,
    marginBottom: 32,
    paddingVertical: 8,
  },
});
