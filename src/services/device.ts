import { Platform } from 'react-native';
import * as Device from 'expo-device';

export interface DeviceInfo {
  isPrinter: boolean; // Se está rodando na maquininha
  isMobile: boolean; // Se está rodando em iOS/Android normal
  deviceId: string;
  deviceName: string;
}

/**
 * Detecta se o app está rodando na maquininha ou em dispositivo mobile normal
 */
export async function getDeviceInfo(): Promise<DeviceInfo> {
  const deviceId = Device.modelId || 'unknown';
  const deviceName = Device.modelName || Device.deviceName || 'Unknown Device';
  
  // Lista de modelos conhecidos de maquininhas POS
  const printerModels = [
    'sunmi', // Sunmi
    'ingenico', // Ingenico
    'gertec', // Gertec
    'tectoy', // Tectoy
    'positivo', // Positivo
    'stone', // Stone
    'elgin', // Elgin
  ];
  
  const modelLower = deviceName.toLowerCase();
  const isPrinter = printerModels.some(model => modelLower.includes(model));
  
  return {
    isPrinter,
    isMobile: !isPrinter,
    deviceId,
    deviceName,
  };
}

/**
 * Verifica se o dispositivo tem capacidade de impressão direta
 */
export function canPrintDirectly(deviceInfo: DeviceInfo): boolean {
  return deviceInfo.isPrinter;
}
