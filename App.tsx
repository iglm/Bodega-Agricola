
import React, { useState, useCallback } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { NotificationProvider, useNotification } from './contexts/NotificationContext';
import { MainLayout } from './layouts/MainLayout';
import { DataIntegrityError } from './services/db';
import { ShieldAlert, Download, RefreshCcw, Database } from 'lucide-react';

const RecoveryUI: React.FC<{ error: DataIntegrityError }> = ({ error }) => {
  const handleEmergencyExport = () => {
    const raw = error.originalData || localStorage.getItem('agrobodega_pro_v1');
    if (!raw) {
        alert("No hay datos legibles para recuperar.");
        return;
    }
    const blob = new Blob([raw], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RECUPERACION_URGENTE_${new Date().getTime()}.json`;
    a.click();
  };

  const handleReset = () => {
    if (confirm("⚠️ ESTA ACCIÓN ES IRREVERSIBLE. Se borrarán todos los datos locales. ¿Desea continuar?")) {
        localStorage.clear();
        window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-6 z-[300]">
      <div className="max-w-md w-full bg-slate-900 border-2 border-red-500/30 rounded-[3rem] p-8 text-center space-y-6 shadow-2xl">
        <div className="w-20 h-20 bg-red-500/20 rounded-3xl flex items-center justify-center mx-auto border border-red-500/40">
           <ShieldAlert className="w-10 h-10 text-red-500 animate-pulse" />
        </div>
        <div className="space-y-2">
            <h1 className="text-white font-black text-2xl uppercase tracking-tighter">Fallo de Integridad</h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Hemos detectado una inconsistencia crítica en los datos locales. El acceso ha sido bloqueado para evitar más daños.
            </p>
        </div>
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-[10px] font-mono text-red-400 text-left overflow-auto max-h-32">
            {error.message}
        </div>
        <div className="grid gap-3">
            <button onClick={handleEmergencyExport} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95">
                <Download className="w-5 h-5" /> DESCARGAR LO RECUPERABLE
            </button>
            <button onClick={handleReset} className="w-full bg-slate-800 hover:bg-red-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95">
                <Database className="w-5 h-5" /> REINICIAR APP (BORRADO TOTAL)
            </button>
            <button onClick={() => window.location.reload()} className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center justify-center gap-2 py-2">
                <RefreshCcw className="w-3 h-3" /> Reintentar Arranque
            </button>
        </div>
      </div>
    </div>
  );
};

const AppContent = () => {
  const { showNotification } = useNotification();
  return <MainLayout onShowNotification={showNotification} />;
};

function App() {
  const [criticalError, setCriticalError] = useState<DataIntegrityError | null>(null);

  const handleDataError = useCallback((err: any) => {
    if (err instanceof DataIntegrityError) {
      setCriticalError(err);
    } else {
      console.error("Error en flujo de datos:", err);
    }
  }, []);

  if (criticalError) {
    return <RecoveryUI error={criticalError} />;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <DataProvider onError={handleDataError}>
             <AppContent />
          </DataProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
