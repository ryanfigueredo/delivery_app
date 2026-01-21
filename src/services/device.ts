import { Platform } from 'react-native';

// Importar expo-device de forma segura
let Device: any = null;
try {
  Device = require('expo-device');
} catch (e) {
  // expo-device não disponível, usar fallback
  console.warn('expo-device não disponível, usando fallback');
}

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
  let deviceId = 'unknown';
  let deviceName = 'Unknown Device';
  
  // Tentar obter informações do dispositivo de forma segura
  if (Device) {
    try {
      deviceId = Device.modelId || Device.osInternalBuildId || 'unknown';
      deviceName = Device.modelName || Device.deviceName || Device.brand || 'Unknown Device';
    } catch (e) {
      console.warn('Erro ao obter informações do dispositivo:', e);
    }
  } else {
    // Fallback: usar Platform
    deviceName = Platform.OS === 'ios' ? 'iOS Device' : 'Android Device';
    deviceId = Platform.OS;
  }
  
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
