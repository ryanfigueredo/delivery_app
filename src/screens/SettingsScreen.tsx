import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Card, Text, TextInput, Button, Switch, ActivityIndicator } from 'react-native-paper';
import { printerService } from '../services/printer';
import { getDeviceInfo } from '../services/device';

export default function SettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [isPrinter, setIsPrinter] = useState(false);
  const [printerDeviceId, setPrinterDeviceId] = useState('');
  const [printerIp, setPrinterIp] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      await printerService.initialize();
      const deviceInfo = await getDeviceInfo();
      setIsPrinter(deviceInfo.isPrinter);
      
      const config = printerService.getPrinterConfig();
      setPrinterDeviceId(config.deviceId || '');
      setPrinterIp(config.ip || '');
    } catch (error: any) {
      Alert.alert('Erro', `Erro ao carregar configurações: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await printerService.savePrinterConfig({
        deviceId: printerDeviceId || undefined,
        ip: printerIp || undefined,
      });
      Alert.alert('Sucesso', 'Configurações salvas!');
    } catch (error: any) {
      Alert.alert('Erro', `Erro ao salvar: ${error.message}`);
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
          <Text style={styles.title}>Configurações da Impressora</Text>
          
          {isPrinter ? (
            <Text style={styles.info}>
              🖨️ Este dispositivo é uma maquininha. A impressão será feita diretamente.
            </Text>
          ) : (
            <>
              <Text style={styles.label}>ID da Maquininha (opcional):</Text>
              <TextInput
                mode="outlined"
                value={printerDeviceId}
                onChangeText={setPrinterDeviceId}
                placeholder="Ex: printer-001"
                style={styles.input}
              />

              <Text style={styles.label}>IP da Maquininha (opcional):</Text>
              <TextInput
                mode="outlined"
                value={printerIp}
                onChangeText={setPrinterIp}
                placeholder="Ex: 192.168.1.100"
                keyboardType="numeric"
                style={styles.input}
              />

              <Text style={styles.helpText}>
                Configure o ID ou IP da maquininha para enviar comandos de impressão.
                Se não configurar, os comandos serão enviados via API.
              </Text>
            </>
          )}
        </Card.Content>
      </Card>

      {!isPrinter && (
        <Button
          mode="contained"
          onPress={handleSave}
          style={styles.saveButton}
          buttonColor="#4CAF50"
        >
          Salvar Configurações
        </Button>
      )}
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  info: {
    fontSize: 16,
    marginTop: 8,
  },
  label: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    marginBottom: 8,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  saveButton: {
    marginTop: 8,
    marginBottom: 32,
    paddingVertical: 8,
  },
});
