
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Vite expone automáticamente las variables VITE_* en import.meta.env
  // No es necesario definir process.env manualmente aquí.
  server: {
    host: true
  }
});
