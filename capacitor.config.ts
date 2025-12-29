
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lucasmateo.datosfincaviva',
  appName: 'DatosFinca Viva',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // 'cleartext' permite peticiones http si tu backend local lo requiere en desarrollo, 
    // pero para producción mantenemos la seguridad en false por defecto.
    cleartext: false
  },
  android: {
    // Optimización para renderizado web en Android
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    }
  },
  plugins: {
    // Configuración para permisos de cámara y micrófono definidos en metadata.json
    Camera: {
      presentationStyle: 'popover'
    }
  }
};

export default config;
