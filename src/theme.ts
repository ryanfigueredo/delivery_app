import { MD3LightTheme } from 'react-native-paper';

// Cores alinhadas com o Android Printer
export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#4CAF50', // Verde principal (holo_green_dark)
    secondary: '#FF9800', // Laranja para pendentes
    error: '#f44336',
    success: '#4CAF50',
    background: '#f5f5f5', // Background cinza claro
    surface: '#ffffff',
    surfaceVariant: '#f5f5f5',
    onSurface: '#212121',
    onSurfaceVariant: '#757575',
  },
};
