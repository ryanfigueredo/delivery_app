import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, Platform, Linking } from 'react-native';
import { Card, Text, TextInput, Button, Switch, ActivityIndicator, List, Divider } from 'react-native-paper';
import { printerService } from '../services/printer';
import { getDeviceInfo } from '../services/device';
import { bluetoothPrinterService, BluetoothPrinter } from '../services/bluetoothPrinter';
import { useAuth } from '../contexts/AuthContext';
import Constants from 'expo-constants';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isPrinter, setIsPrinter] = useState(false);
  const [printerDeviceId, setPrinterDeviceId] = useState('');
  const [printerIp, setPrinterIp] = useState('');
  const [bluetoothPrinter, setBluetoothPrinter] = useState<BluetoothPrinter | null>(null);
  const [scanning, setScanning] = useState(false);
  const [availablePrinters, setAvailablePrinters] = useState<BluetoothPrinter[]>([]);
  const [botStatus, setBotStatus] = useState<'online' | 'offline' | 'checking'>('checking');

  useEffect(() => {
    loadSettings();
    checkBotStatus();
    // Verificar status do bot a cada 30 segundos
    const interval = setInterval(checkBotStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkBotStatus = async () => {
    try {
      // Verificar se há pedidos recentes (últimas 2 horas) como indicador de bot online
      const response = await fetch(`${Constants.expoConfig?.extra?.apiBaseUrl || 'https://delivery-back-eosin.vercel.app'}/api/orders?page=1&limit=1`, {
        headers: {
          'X-API-Key': Constants.expoConfig?.extra?.apiKey || '',
          'X-Tenant-Id': Constants.expoConfig?.extra?.tenantId || 'tamboril-burguer',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        // Se conseguiu buscar pedidos, considerar bot online
        // (pedidos só chegam se bot estiver funcionando)
        setBotStatus('online');
      } else {
        setBotStatus('offline');
      }
    } catch (error) {
      setBotStatus('offline');
    }
  };

  const openBotQRCode = () => {
    // URL do bot no Railway (ajustar conforme necessário)
    const botUrl = 'https://web-production-1a0f.up.railway.app';
    Linking.openURL(botUrl).catch(() => {
      Alert.alert('Erro', 'Não foi possível abrir o link. Verifique se o bot está rodando.');
    });
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      await printerService.initialize();
      await bluetoothPrinterService.initialize();
      const deviceInfo = await getDeviceInfo();
      setIsPrinter(deviceInfo.isPrinter);
      
      const config = printerService.getPrinterConfig();
      setPrinterDeviceId(config.deviceId || '');
      setPrinterIp(config.ip || '');
      
      // Carregar impressora Bluetooth configurada
      const btPrinter = bluetoothPrinterService.getConfiguredPrinter();
      setBluetoothPrinter(btPrinter);
    } catch (error: any) {
      Alert.alert('Erro', `Erro ao carregar configurações: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const scanForPrinters = async () => {
    try {
      setScanning(true);
      const printers = await bluetoothPrinterService.scanPrinters();
      setAvailablePrinters(printers);
      
      if (printers.length === 0) {
        Alert.alert('Nenhuma impressora encontrada', 'Certifique-se de que a impressora está ligada e com Bluetooth ativado.');
      }
    } catch (error: any) {
      Alert.alert('Erro', `Erro ao escanear impressoras: ${error.message}`);
    } finally {
      setScanning(false);
    }
  };

  const selectPrinter = async (printer: BluetoothPrinter) => {
    try {
      await bluetoothPrinterService.savePrinter(printer);
      setBluetoothPrinter(printer);
      Alert.alert('Sucesso', `Impressora ${printer.name} configurada com sucesso!`);
    } catch (error: any) {
      Alert.alert('Erro', `Erro ao configurar impressora: ${error.message}`);
    }
  };

  const testPrint = async () => {
    try {
      if (!bluetoothPrinter) {
        Alert.alert('Aviso', 'Configure uma impressora Bluetooth primeiro.');
        return;
      }
      
      const success = await bluetoothPrinterService.testPrint();
      if (success) {
        Alert.alert('Sucesso', 'Teste de impressão enviado!');
      } else {
        Alert.alert('Erro', 'Falha no teste de impressão.');
      }
    } catch (error: any) {
      Alert.alert('Erro', `Erro ao testar impressão: ${error.message}`);
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

      {/* Configuração de Impressora Bluetooth */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>Impressora Bluetooth</Text>
          
          {bluetoothPrinter ? (
            <>
              <Text style={styles.info}>
                ✅ Impressora configurada: {bluetoothPrinter.name}
              </Text>
              <Text style={styles.helpText}>
                Endereço: {bluetoothPrinter.address}
              </Text>
              <Button
                mode="outlined"
                onPress={testPrint}
                style={styles.testButton}
              >
                Testar Impressão
              </Button>
            </>
          ) : (
            <>
              <Text style={styles.helpText}>
                Configure uma impressora térmica Bluetooth para impressão automática de pedidos.
              </Text>
              <Button
                mode="contained"
                onPress={scanForPrinters}
                style={styles.scanButton}
                buttonColor="#4CAF50"
                loading={scanning}
                disabled={scanning}
              >
                {scanning ? 'Escaneando...' : 'Escanear Impressoras'}
              </Button>
            </>
          )}
          
          {availablePrinters.length > 0 && (
            <View style={styles.printersList}>
              <Text style={styles.label}>Impressoras encontradas:</Text>
              {availablePrinters.map((printer) => (
                <List.Item
                  key={printer.id}
                  title={printer.name}
                  description={printer.address}
                  left={(props) => <List.Icon {...props} icon="printer" />}
                  right={(props) => (
                    <Button
                      mode="outlined"
                      onPress={() => selectPrinter(printer)}
                      compact
                    >
                      Selecionar
                    </Button>
                  )}
                  style={styles.printerItem}
                />
              ))}
            </View>
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

      {/* Seção WhatsApp Bot */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>🤖 Bot WhatsApp</Text>
          <Text style={styles.helpText}>
            Configure o bot WhatsApp para receber pedidos automaticamente.
          </Text>
          
          <View style={styles.botStatusContainer}>
            <View style={styles.botStatusRow}>
              <Text style={styles.label}>Status do Bot:</Text>
              <View style={styles.statusIndicator}>
                <View style={[
                  styles.statusDot,
                  botStatus === 'online' ? styles.statusOnline : 
                  botStatus === 'offline' ? styles.statusOffline : 
                  styles.statusChecking
                ]} />
                <Text style={[
                  styles.statusText,
                  botStatus === 'online' && styles.statusTextOnline,
                  botStatus === 'offline' && styles.statusTextOffline
                ]}>
                  {botStatus === 'online' ? 'Online' : 
                   botStatus === 'offline' ? 'Offline' : 
                   'Verificando...'}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.helpText} style={{ marginTop: 16, marginBottom: 8 }}>
            Para conectar o WhatsApp:
          </Text>
          <Text style={styles.helpText}>
            1. O bot precisa estar rodando (Railway ou servidor){'\n'}
            2. Acesse a URL do bot para ver o QR Code{'\n'}
            3. Escaneie o QR Code com seu WhatsApp{'\n'}
            4. Os pedidos aparecerão automaticamente aqui
          </Text>

          <Button
            mode="contained"
            onPress={openBotQRCode}
            style={styles.botButton}
            buttonColor="#25D366"
            icon="whatsapp"
          >
            Abrir QR Code do Bot
          </Button>

          <Text style={[styles.helpText, { marginTop: 8, fontSize: 10 }]}>
            💡 Os pedidos do WhatsApp aparecerão automaticamente na tela de Pedidos quando o bot estiver conectado.
          </Text>
        </Card.Content>
      </Card>

      {/* Seção de Conta */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>Conta</Text>
          {user && (
            <>
              <Text style={styles.info}>Usuário: {user.username}</Text>
              <Text style={styles.info}>Nome: {user.name}</Text>
              <Text style={styles.info}>Função: {user.role}</Text>
            </>
          )}
          <Divider style={{ marginVertical: 16 }} />
          <Button
            mode="outlined"
            onPress={async () => {
              Alert.alert(
                'Sair',
                'Tem certeza que deseja sair?',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Sair',
                    style: 'destructive',
                    onPress: async () => {
                      await logout();
                    },
                  },
                ]
              );
            }}
            buttonColor="#f44336"
            textColor="#f44336"
            style={styles.logoutButton}
          >
            Sair
          </Button>
        </Card.Content>
      </Card>
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
  scanButton: {
    marginTop: 16,
    marginBottom: 8,
  },
  testButton: {
    marginTop: 16,
  },
  printersList: {
    marginTop: 16,
  },
  printerItem: {
    backgroundColor: '#f5f5f5',
    marginVertical: 4,
    borderRadius: 8,
  },
  logoutButton: {
    marginTop: 8,
  },
  botStatusContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  botStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusOnline: {
    backgroundColor: '#4CAF50',
  },
  statusOffline: {
    backgroundColor: '#f44336',
  },
  statusChecking: {
    backgroundColor: '#FF9800',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusTextOnline: {
    color: '#4CAF50',
  },
  statusTextOffline: {
    color: '#f44336',
  },
  botButton: {
    marginTop: 16,
    marginBottom: 8,
  },
});
