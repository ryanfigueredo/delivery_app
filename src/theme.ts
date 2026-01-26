import { MD3LightTheme } from 'react-native-paper';

// Cores alinhadas com o Android Printer
export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#22c55e', // Verde principal moderno
    secondary: '#FF9800', // Laranja para pendentes
    error: '#f44336',
    success: '#22c55e',
    background: '#f5f5f5', // Background cinza claro
    surface: '#ffffff',
    surfaceVariant: '#f5f5f5',
    onSurface: '#212121',
    onSurfaceVariant: '#757575',
  },
};
