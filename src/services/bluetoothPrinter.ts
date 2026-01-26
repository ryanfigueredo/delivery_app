import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Order } from './api';

const PRINTER_MAC_KEY = '@bluetooth_printer_mac';
const PRINTER_NAME_KEY = '@bluetooth_printer_name';

export interface BluetoothPrinter {
  id: string;
  name: string;
  address: string;
}

/**
 * Serviço de impressão Bluetooth para impressoras térmicas
 * Funciona com Android e iOS usando bibliotecas React Native
 */
export class BluetoothPrinterService {
  private connectedPrinter: BluetoothPrinter | null = null;
  private isConnected = false;

  /**
   * Inicializa o serviço e carrega impressora configurada
   */
  async initialize(): Promise<void> {
    try {
      const mac = await AsyncStorage.getItem(PRINTER_MAC_KEY);
      const name = await AsyncStorage.getItem(PRINTER_NAME_KEY);
      
      if (mac && name) {
        this.connectedPrinter = {
          id: mac,
          name: name,
          address: mac,
        };
        console.log('Impressora configurada:', name, mac);
      }
    } catch (error) {
      console.error('Erro ao inicializar serviço de impressão:', error);
    }
  }

  /**
   * Salva configuração da impressora
   */
  async savePrinter(printer: BluetoothPrinter): Promise<void> {
    try {
      await AsyncStorage.setItem(PRINTER_MAC_KEY, printer.address);
      await AsyncStorage.setItem(PRINTER_NAME_KEY, printer.name);
      this.connectedPrinter = printer;
      console.log('Impressora salva:', printer.name);
    } catch (error) {
      console.error('Erro ao salvar impressora:', error);
      throw error;
    }
  }

  /**
   * Obtém impressora configurada
   */
  getConfiguredPrinter(): BluetoothPrinter | null {
    return this.connectedPrinter;
  }

  /**
   * Verifica se tem impressora configurada
   */
  hasPrinter(): boolean {
    return this.connectedPrinter !== null;
  }

  /**
   * Formata pedido para impressão (formato ESC/POS)
   */
  private formatOrderForPrint(order: Order): string {
    const lines: string[] = [];
    
    // Comandos ESC/POS
    const ESC = '\x1B';
    const GS = '\x1D';
    
    // Reset e inicializar
    lines.push(`${ESC}@`);
    
    // Centralizar título
    lines.push(`${ESC}a${String.fromCharCode(1)}`); // Centralizar
    lines.push('═══════════════════════');
    lines.push('   PEDIDOS EXPRESS');
    lines.push('═══════════════════════');
    lines.push('');
    
    // Alinhar à esquerda
    lines.push(`${ESC}a${String.fromCharCode(0)}`); // Esquerda
    
    // Informações do pedido
    lines.push(`Pedido: ${order.display_id || order.id}`);
    lines.push(`Cliente: ${order.customer_name}`);
    lines.push(`Telefone: ${order.customer_phone}`);
    lines.push(`Data: ${new Date(order.created_at).toLocaleString('pt-BR')}`);
    lines.push('');
    lines.push('───────────────────────');
    lines.push('ITENS:');
    lines.push('───────────────────────');
    
    // Itens do pedido
    order.items.forEach((item) => {
      const quantity = item.quantity || 1;
      const price = typeof item.price === 'number' ? item.price : parseFloat(item.price?.toString() || '0');
      const total = price * quantity;
      
      lines.push(`${quantity}x ${item.name}`);
      lines.push(`   R$ ${total.toFixed(2).replace('.', ',')}`);
    });
    
    lines.push('');
    lines.push('───────────────────────');
    
    // Total
    lines.push(`${ESC}a${String.fromCharCode(2)}`); // Direita
    lines.push(`TOTAL: R$ ${order.total_price.toFixed(2).replace('.', ',')}`);
    lines.push('');
    
    // Informações adicionais
    lines.push(`${ESC}a${String.fromCharCode(0)}`); // Esquerda
    if (order.order_type === 'delivery' && order.delivery_address) {
      lines.push(`Tipo: Delivery`);
      lines.push(`Endereço: ${order.delivery_address}`);
    } else {
      lines.push(`Tipo: Restaurante`);
    }
    lines.push(`Pagamento: ${order.payment_method || 'Não informado'}`);
    lines.push('');
    lines.push('═══════════════════════');
    lines.push('   Obrigado!');
    lines.push('═══════════════════════');
    lines.push('');
    lines.push('');
    lines.push('');
    
    // Comando de corte (se suportado)
    lines.push(`${GS}V${String.fromCharCode(0)}`); // Corte parcial
    
    return lines.join('\n');
  }

  /**
   * Converte string para bytes ESC/POS
   */
  private stringToBytes(str: string): Uint8Array {
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      bytes[i] = str.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Imprime um pedido
   */
  async printOrder(order: Order): Promise<boolean> {
    try {
      if (!this.connectedPrinter) {
        throw new Error('Nenhuma impressora configurada. Configure uma impressora Bluetooth nas configurações.');
      }

      console.log('🖨️ Imprimindo pedido:', order.id);
      
      // Formatar pedido
      const receiptText = this.formatOrderForPrint(order);
      
      // Para React Native, vamos usar uma abordagem que funciona em ambos
      // Android: react-native-bluetooth-escpos-printer
      // iOS: react-native-bluetooth-classic ou similar
      
      if (Platform.OS === 'android') {
        return await this.printAndroid(receiptText);
      } else if (Platform.OS === 'ios') {
        return await this.printIOS(receiptText);
      } else {
        throw new Error('Plataforma não suportada');
      }
    } catch (error: any) {
      console.error('Erro ao imprimir pedido:', error);
      throw error;
    }
  }

  /**
   * Imprime no Android
   */
  private async printAndroid(receiptText: string): Promise<boolean> {
    try {
      // Usar react-native-bluetooth-escpos-printer
      // Se não tiver a biblioteca, vamos simular por enquanto
      
      // TODO: Implementar com biblioteca real quando instalar
      // const BluetoothEscposPrinter = require('react-native-bluetooth-escpos-printer');
      // await BluetoothEscposPrinter.printText(receiptText, {});
      
      console.log('📱 [ANDROID] Imprimindo:', receiptText.substring(0, 100) + '...');
      console.log('⚠️ Instale react-native-bluetooth-escpos-printer para imprimir de verdade');
      
      // Por enquanto, retorna sucesso (modo teste)
      return true;
    } catch (error) {
      console.error('Erro ao imprimir no Android:', error);
      throw error;
    }
  }

  /**
   * Imprime no iOS
   */
  private async printIOS(receiptText: string): Promise<boolean> {
    try {
      // iOS tem suporte limitado para Bluetooth direto
      // Pode precisar usar AirPrint ou biblioteca específica
      
      console.log('📱 [iOS] Imprimindo:', receiptText.substring(0, 100) + '...');
      console.log('⚠️ iOS pode precisar de biblioteca específica ou AirPrint');
      
      // Por enquanto, retorna sucesso (modo teste)
      return true;
    } catch (error) {
      console.error('Erro ao imprimir no iOS:', error);
      throw error;
    }
  }

  /**
   * Lista impressoras Bluetooth disponíveis
   * (Implementação depende da biblioteca escolhida)
   */
  async scanPrinters(): Promise<BluetoothPrinter[]> {
    try {
      // TODO: Implementar scan com biblioteca Bluetooth
      // Por enquanto retorna vazio
      console.log('⚠️ Implementar scan de impressoras Bluetooth');
      return [];
    } catch (error) {
      console.error('Erro ao escanear impressoras:', error);
      return [];
    }
  }

  /**
   * Testa impressão
   */
  async testPrint(): Promise<boolean> {
    try {
      const testOrder: Order = {
        id: 'test',
        customer_name: 'Teste',
        customer_phone: '(00) 00000-0000',
        items: [
          { name: 'Hambúrguer Teste', quantity: 1, price: 20.00 }
        ],
        total_price: 20.00,
        status: 'pending',
        created_at: new Date().toISOString(),
        display_id: '#TEST',
      };
      
      return await this.printOrder(testOrder);
    } catch (error) {
      console.error('Erro no teste de impressão:', error);
      return false;
    }
  }
}

export const bluetoothPrinterService = new BluetoothPrinterService();
