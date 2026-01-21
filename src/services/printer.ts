import { apiService, Order } from './api';
import { getDeviceInfo, DeviceInfo } from './device';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PRINTER_DEVICE_ID_KEY = '@printer_device_id';
const PRINTER_IP_KEY = '@printer_ip';

export interface PrinterConfig {
  deviceId?: string;
  ip?: string;
}

/**
 * Serviço de impressão
 * Se for maquininha: imprime diretamente
 * Se for mobile: envia comando para maquininha
 */
export class PrinterService {
  private deviceInfo: DeviceInfo | null = null;
  private printerConfig: PrinterConfig = {};

  async initialize() {
    this.deviceInfo = await getDeviceInfo();
    await this.loadPrinterConfig();
  }

  private async loadPrinterConfig() {
    try {
      const deviceId = await AsyncStorage.getItem(PRINTER_DEVICE_ID_KEY);
      const ip = await AsyncStorage.getItem(PRINTER_IP_KEY);
      this.printerConfig = {
        deviceId: deviceId || undefined,
        ip: ip || undefined,
      };
    } catch (error) {
      console.error('Erro ao carregar configuração da impressora:', error);
    }
  }

  async savePrinterConfig(config: PrinterConfig) {
    try {
      if (config.deviceId) {
        await AsyncStorage.setItem(PRINTER_DEVICE_ID_KEY, config.deviceId);
      }
      if (config.ip) {
        await AsyncStorage.setItem(PRINTER_IP_KEY, config.ip);
      }
      this.printerConfig = { ...this.printerConfig, ...config };
    } catch (error) {
      console.error('Erro ao salvar configuração da impressora:', error);
    }
  }

  async printOrder(order: Order): Promise<boolean> {
    if (!this.deviceInfo) {
      await this.initialize();
    }

    if (this.deviceInfo?.isPrinter) {
      // Imprime diretamente na maquininha
      return this.printDirectly(order);
    } else {
      // Envia comando para maquininha
      return this.sendPrintCommand(order);
    }
  }

  /**
   * Imprime diretamente na maquininha (usando SDK Stone)
   */
  private async printDirectly(order: Order): Promise<boolean> {
    try {
      // TODO: Implementar impressão usando SDK Stone
      // Por enquanto, vamos usar a API para marcar como impresso
      console.log('Imprimindo diretamente na maquininha:', order.id);
      
      // Aqui você integraria com o SDK Stone
      // Exemplo:
      // const receipt = formatReceipt(order);
      // await StoneSDK.print(receipt);
      
      // Por enquanto, apenas marca como impresso
      return true;
    } catch (error) {
      console.error('Erro ao imprimir diretamente:', error);
      return false;
    }
  }

  /**
   * Envia comando de impressão para a maquininha via API
   */
  private async sendPrintCommand(order: Order): Promise<boolean> {
    try {
      if (!this.printerConfig.deviceId && !this.printerConfig.ip) {
        throw new Error('Impressora não configurada. Configure o ID ou IP da maquininha.');
      }

      // Envia comando via API para a maquininha imprimir
      const response = await fetch('https://tamboril-burguer.vercel.app/api/printer/print', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': '7e229ceb049fcfa2d3c6ff29b4e50d202bd3855804e66fb02487419e79124b26',
        },
        body: JSON.stringify({
          orderId: order.id,
          printerDeviceId: this.printerConfig.deviceId,
          printerIp: this.printerConfig.ip,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro ao enviar comando: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Erro ao enviar comando de impressão:', error);
      throw error;
    }
  }

  getPrinterConfig(): PrinterConfig {
    return { ...this.printerConfig };
  }

  isPrinterDevice(): boolean {
    return this.deviceInfo?.isPrinter || false;
  }
}

export const printerService = new PrinterService();
